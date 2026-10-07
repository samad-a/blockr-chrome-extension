// Short release notes shown once inside the options page after an update.
// The full history lives in CHANGELOG.md at the repository root; keep the two in step.

export type ReleaseNote = {
  version: string
  highlights: string[]
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.1',
    highlights: [
      'Dark mode, or follow your device setting',
      'Optional password protection for pausing and changing your list',
      'Block schedule: only block on the days and hours you choose',
      'Daily time limits for sites on your custom list',
      'More sites in the social media and short-form presets, each covering all of its addresses',
      'Export and import your custom list from Settings',
    ],
  },
]

export const notesFor = (version: string): ReleaseNote | undefined =>
  RELEASE_NOTES.find((note) => note.version === version)
