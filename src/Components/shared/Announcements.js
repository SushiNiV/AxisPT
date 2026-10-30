import React from 'react';
import { BiBell, BiPlus } from 'react-icons/bi';
import Card from '../ui/Card';
import Button from '../ui/Button';

/**
 * Announcements list. Scrolls inside its card, so the card never makes its row taller.
 * To match a neighbor's height on desktop, wrap it as:
 *   <div className="relative"><div className="lg:absolute lg:inset-0"><Announcements /></div></div>
 */
export default function Announcements({ announcements = [], isAdmin = false, onCreate, onEdit, onDelete }) {
  return (
    <Card
      title="Announcements"
      className="h-full"
      action={
        isAdmin ? (
          <Button variant="secondary" size="sm" onClick={onCreate}>
            <BiPlus className="text-base" aria-hidden="true" /> Create
          </Button>
        ) : null
      }
    >
      {/* h-full + overflow: fills the card on desktop and scrolls; on mobile it is capped at 26rem. */}
      <div className="h-full max-h-[26rem] overflow-y-auto pr-1 [scrollbar-width:none] lg:max-h-none [&::-webkit-scrollbar]:hidden">
        {announcements.length === 0 ? (
          <p className="flex h-full min-h-[8rem] items-center justify-center text-sm text-ink-3">
            No announcements yet.
          </p>
        ) : (
          <ul className="-my-1 divide-y divide-line">
            {announcements.map((a) => (
              <li key={a.id} className="py-4">
                <div className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink"
                  >
                    <BiBell className="text-sm" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug text-ink">{a.title}</p>
                      <span className="shrink-0 text-xs tabular-nums text-ink-3">
                        {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink-2">{a.body}</p>

                    {isAdmin && (
                      <div className="mt-2.5 flex gap-3">
                        <button type="button" onClick={() => onEdit(a)} className="text-xs font-medium text-brand-ink hover:underline">
                          Edit
                        </button>
                        <button type="button" onClick={() => onDelete(a)} className="text-xs font-medium text-danger hover:underline">
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}