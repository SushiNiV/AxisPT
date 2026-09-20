/**
 * ============================================================================
 * GradingEngine
 * ============================================================================
 * Pure grading logic for the STAMP Term Grade document's grading policy.
 * No database access here - this module only knows how to turn a course's
 * category + a set of named score components into grades. Keeping it pure
 * means the same weight tables can be reused wherever grades are computed
 * (currently: DocumentModel.getTermGradeData; eventually: AddGrade.js's
 * grade-entry flow once it's reworked to capture these sub-scores).
 *
 * SCORE SHAPE: grade_components.term is a hard enum (Prelim/Midterm/Final -
 * there's no "whole semester" option), so every component - including ones
 * that conceptually span the whole semester like Quizzes/AT - is entered
 * once per term. Scores are therefore passed around as:
 *
 *   { Prelim: { 'Quizzes/AT': 88, 'Prelim Exam': 90 },
 *     Midterm: { 'Quizzes/AT': 85, 'Midterm Exam': 87 },
 *     Final: { 'Quizzes/AT': 91, 'Final Exam': 93 } }
 *
 * Two distinct grades come out of this module for a given course:
 *
 *   1. Period-local term grade (per Prelim/Midterm/Final table on the
 *      document) - that term's own components only, re-weighted to sum to
 *      100% among just themselves. This is a progress snapshot, not
 *      official - exactly what "separate for each term" means on the doc.
 *
 *   2. Cumulative course grade - the single official grade, computed from
 *      the full-semester weights. Components that span all three terms
 *      (Quizzes/AT, Unit Practical Exam) use the average of whichever
 *      terms' entries exist so far; single-term components (each Exam,
 *      each OSCE) use that term's entry directly.
 * ============================================================================
 */

const PASSING_SCORE = 75;
const HIGHEST_GRADE_POINT = 1.0;
const LOWEST_PASSING_GRADE_POINT = 3.0;
const FAILING_GRADE_POINT = 5.0;
const GRADE_POINT_STEP = 0.25;
const PERCENTAGE_STEP = 3;

const TERMS = ['Prelim', 'Midterm', 'Final'];

/**
 * Full-semester weight tables, keyed by course category. Every entry's
 * weights sum to 100. `spansAllTerms: true` marks components entered once
 * per term but averaged together for the cumulative grade (Quizzes/AT,
 * Unit Practical Exam); everything else belongs to exactly one term.
 */
const WEIGHT_TABLES = {
  // Quizzes/AT 40% (35 Quizzes + 5 Canvas/Other AT, combined into one
  // entered score per term - the document's tables don't expose a
  // separate Canvas column), Prelim/Midterm/Final Exam 20% each.
  lecture_only: [
    { component: 'Quizzes/AT', spansAllTerms: true, weight: 40 },
    { component: 'Prelim Exam', term: 'Prelim', weight: 20 },
    { component: 'Midterm Exam', term: 'Midterm', weight: 20 },
    { component: 'Final Exam', term: 'Final', weight: 20 }
  ],

  // Lecture (60%) and Laboratory (40%) portions, each internally split the
  // same way as their standalone versions above, then scaled to their
  // share of the total: Lecture -> Quizzes/AT 24%, each Exam 12%;
  // Lab -> Unit Practical 16%, each OSCE 8%.
  lecture_lab: [
    { component: 'Quizzes/AT', spansAllTerms: true, weight: 24 },
    { component: 'Prelim Exam', term: 'Prelim', weight: 12 },
    { component: 'Midterm Exam', term: 'Midterm', weight: 12 },
    { component: 'Final Exam', term: 'Final', weight: 12 },
    { component: 'Unit Practical Exam', spansAllTerms: true, weight: 16 },
    { component: 'Prelim OSCE/OSPE', term: 'Prelim', weight: 8 },
    { component: 'Midterm OSCE/OSPE', term: 'Midterm', weight: 8 },
    { component: 'Final OSCE/OSPE', term: 'Final', weight: 8 }
  ],

  // PTCD/CCMT/FPRP2 pattern: the regular coursework grade (computed via
  // the lecture_lab or lecture_only table, whichever fits the course)
  // counts for 60%, a standalone Comprehensive Examination counts for 40%.
  comprehensive: [
    { component: 'Course Grade', isCourseGradeReference: true, weight: 60 },
    { component: 'Comprehensive Examination', term: 'Final', weight: 40 }
  ],

  // ACEP2/RTEP2/RTAP2 pattern: same idea, 50/50 with a Revalida Examination.
  revalida: [
    { component: 'Course Grade', isCourseGradeReference: true, weight: 50 },
    { component: 'Revalida Examination', term: 'Final', weight: 50 }
  ]
};

class GradingEngine {

  /**
   * Determines a course's grading category. Explicit overrides
   * (courses.grading_scheme) win; otherwise it's derived from units.
   */
  static getCourseCategory(course) {
    if (course.grading_scheme === 'comprehensive') return 'comprehensive';
    if (course.grading_scheme === 'revalida') return 'revalida';
    return Number(course.lab_units) > 0 ? 'lecture_lab' : 'lecture_only';
  }

  /** Returns the weight table definition for a given category. */
  static getWeightTable(category) {
    return WEIGHT_TABLES[category] || WEIGHT_TABLES.lecture_only;
  }

  /**
   * Exposes the percentage->grade-point conversion scale as data, so
   * frontends computing a live preview never have to hardcode these
   * constants themselves (see AddGrade.js's local preview functions).
   */
  static getGradeScale() {
    return {
      passingPercentage: PASSING_SCORE,
      highestPoint: HIGHEST_GRADE_POINT,
      lowestPassingPoint: LOWEST_PASSING_GRADE_POINT,
      failingPoint: FAILING_GRADE_POINT,
      pointStep: GRADE_POINT_STEP,
      percentageStep: PERCENTAGE_STEP
    };
  }

  /**
   * Returns the enterable component fields for a given COURSE - i.e.
   * everything a grade sheet UI should render an input for. Takes the full
   * course record (not just a category string) because 'comprehensive'
   * and 'revalida' categories recursively pull their "Course Grade"
   * portion from the course's own underlying lecture_only/lecture_lab
   * table, which depends on that specific course's lab_units - a flat
   * category->fields lookup can't resolve that correctly.
   *
   * @param {Object} course - needs lab_units and grading_scheme
   * @returns {Array<{ component: string, term: 'Prelim'|'Midterm'|'Final'|null, weight: number }>}
   *   term: null means the component is entered once per term (spansAllTerms).
   */
  static getEnterableFields(course) {
    const category = this.getCourseCategory(course);
    const table = this.getWeightTable(category);

    const fields = [];
    for (const row of table) {
      if (row.isCourseGradeReference) {
        // Recurse into the course's real underlying table (lecture_only or
        // lecture_lab, based on its own lab_units) rather than the
        // comprehensive/revalida table, which has no lecture/lab detail.
        const underlyingCourse = { ...course, grading_scheme: null };
        fields.push(...this.getEnterableFields(underlyingCourse));
      } else {
        fields.push({
          component: row.component,
          term: row.spansAllTerms ? null : row.term,
          weight: row.weight
        });
      }
    }
    return fields;
  }

  /**
   * Looks up a single component's weight within a category's table, for a
   * given term. Used when persisting grade_components.percentage as a
   * record of what weight was in effect at save time - the live
   * calculations always read from WEIGHT_TABLES directly, never from this
   * stored value, so it's documentation rather than a source of truth.
   */
  static getComponentWeight(category, term, component) {
    const row = this.getWeightTable(category).find(
      (r) => r.component === component && (r.spansAllTerms || r.term === term)
    );
    return row ? row.weight : null;
  }

  /**
   * Converts a composite percentage score (0-100) into its 1.00-5.00 grade
   * point equivalent (matches GradeManageModel.percentageToGradePoint -
   * kept in sync here since this module has no dependency on that one).
   */
  static percentageToGradePoint(percentage) {
    if (percentage < PASSING_SCORE) return FAILING_GRADE_POINT;
    const steps = Math.floor((100 - percentage) / PERCENTAGE_STEP);
    const gradePoint = HIGHEST_GRADE_POINT + GRADE_POINT_STEP * steps;
    return Math.min(gradePoint, LOWEST_PASSING_GRADE_POINT);
  }

  /**
   * Computes a period-local term grade: takes only the weight-table rows
   * belonging to (or spanning into) the given term, re-weights them to sum
   * to 100% among themselves, and averages whatever scores are provided
   * for THAT TERM specifically. Components with no score yet for this term
   * are excluded (not treated as 0), so a term's snapshot only reflects
   * what's actually been entered for that period.
   *
   * @param {'lecture_only'|'lecture_lab'} category
   * @param {'Prelim'|'Midterm'|'Final'} term
   * @param {Object<string, Object<string, number>>} scoresByTerm
   * @returns {{ average: number|null, transmuted: number|null, pointGrade: number|null }}
   */
  static computeTermGrade(category, term, scoresByTerm) {
    const table = this.getWeightTable(category)
      .filter((row) => !row.isCourseGradeReference && (row.spansAllTerms || row.term === term));

    const termScores = scoresByTerm[term] || {};
    const provided = table.filter((row) => {
      const v = termScores[row.component];
      return v !== undefined && v !== null && v !== '';
    });

    if (provided.length === 0) {
      return { average: null, transmuted: null, pointGrade: null };
    }

    const localWeightSum = provided.reduce((sum, row) => sum + row.weight, 0);
    const weightedSum = provided.reduce(
      (sum, row) => sum + (Number(termScores[row.component]) * row.weight) / localWeightSum,
      0
    );

    const average = Math.round(weightedSum * 100) / 100;
    const pointGrade = this.percentageToGradePoint(average);

    return { average, transmuted: average, pointGrade };
  }

  /**
   * Resolves a single weight-table row's effective score for the
   * cumulative calculation: spansAllTerms components average whichever
   * terms' entries exist; single-term components use that term directly.
   */
  static _resolveRowScore(row, scoresByTerm) {
    if (row.spansAllTerms) {
      const values = TERMS
        .map((t) => scoresByTerm[t]?.[row.component])
        .filter((v) => v !== undefined && v !== null && v !== '')
        .map(Number);
      if (values.length === 0) return null;
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    }

    const v = scoresByTerm[row.term]?.[row.component];
    return (v === undefined || v === null || v === '') ? null : Number(v);
  }

  /**
   * Computes the single cumulative course grade using the FULL weight
   * table. Missing components are excluded and the remaining weights are
   * NOT re-normalized here - an incomplete set of components yields 'INC'
   * rather than a partial grade, since this is the official record (unlike
   * computeTermGrade's local snapshots, which are allowed to be partial).
   *
   * For 'comprehensive'/'revalida' categories, the "Course Grade"
   * reference row is resolved recursively using the course's underlying
   * lecture_only/lecture_lab table before being folded into the final mix.
   *
   * @param {Object} course - needs lab_units and grading_scheme
   * @param {Object<string, Object<string, number>>} scoresByTerm
   * @returns {{ finalGrade: number|null, remarks: 'P'|'F'|'INC' }}
   */
  static computeCumulativeGrade(course, scoresByTerm) {
    const category = this.getCourseCategory(course);
    const table = this.getWeightTable(category);

    const resolved = table.map((row) => {
      if (row.isCourseGradeReference) {
        const underlyingCourse = { ...course, grading_scheme: null };
        const underlying = this.computeCumulativeGrade(underlyingCourse, scoresByTerm);
        return { weight: row.weight, score: underlying.finalGrade === null ? null : underlying.finalGrade };
      }
      return { weight: row.weight, score: this._resolveRowScore(row, scoresByTerm) };
    });

    const provided = resolved.filter((row) => row.score !== null);
    const isComplete = provided.length === resolved.length;

    if (provided.length === 0) {
      return { finalGrade: null, remarks: 'INC' };
    }

    const weightSum = provided.reduce((sum, row) => sum + row.weight, 0);
    const weightedSum = provided.reduce(
      (sum, row) => sum + (Number(row.score) * row.weight) / weightSum,
      0
    );

    const percentage = Math.round(weightedSum * 100) / 100;
    const finalGrade = this.percentageToGradePoint(percentage);
    const remarks = !isComplete ? 'INC' : (finalGrade === FAILING_GRADE_POINT ? 'F' : 'P');

    return { finalGrade, remarks };
  }
}

module.exports = GradingEngine;