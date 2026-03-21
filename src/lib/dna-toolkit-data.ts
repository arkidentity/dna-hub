/**
 * DNA Toolkit — Static config for leader guide tools
 *
 * Each tool has a name, description, and PDF filename.
 * PDFs are stored in Supabase Storage under the `leader-guides` bucket.
 * To add a new tool, just add an entry to this array.
 */

export interface DNAToolGuide {
  id: string;
  name: string;
  description: string;
  pdfFilename: string;
}

export const DNA_TOOLKIT_GUIDES: DNAToolGuide[] = [
  {
    id: 'life-assessment',
    name: 'Life Assessment',
    description: 'Surfacing where disciples are starting from',
    pdfFilename: 'Life Assessment Leader Guide.pdf',
  },
  {
    id: '3d-journal',
    name: '3D Journal',
    description: 'The daily Scripture reading and reflection practice',
    pdfFilename: '3D Journal Leader Guide.pdf',
  },
  {
    id: '4d-prayer',
    name: '4D Prayer',
    description: 'The daily prayer rhythm: Revere, Reflect, Request, Rest',
    pdfFilename: '4D Prayer Leader Guide.pdf',
  },
  {
    id: 'creed-cards',
    name: 'Creed Cards',
    description: 'Anchoring disciples in foundational doctrine',
    pdfFilename: 'Creed Cards Leader Guide.pdf',
  },
  {
    id: 'communion',
    name: 'Communion',
    description: 'Leading the shared table as an act of remembrance and unity',
    pdfFilename: 'Communion Leader Guide.pdf',
  },
  {
    id: 'testimony-time',
    name: 'Testimony Time',
    description: 'Teaching disciples to articulate what God is doing in their lives',
    pdfFilename: 'Testimony Leader Guide.pdf',
  },
  {
    id: 'outreach',
    name: 'Outreach',
    description: 'Taking the group into a live mission experience together',
    pdfFilename: 'Outreach Leader Guide.pdf',
  },
  {
    id: 'art-of-asking-questions',
    name: 'Art of Asking Questions',
    description: 'Building the skill of Spirit-led, discovery-based conversations',
    pdfFilename: 'Art of Asking Questions Leader Guide.pdf',
  },
  {
    id: 'listening-prayer',
    name: 'Listening Prayer Circle',
    description: 'Practicing hearing from God for one another',
    pdfFilename: 'Listening Prayer Leader Guide.pdf',
  },
  {
    id: 'breaking-strongholds',
    name: 'Breaking Strongholds',
    description: 'Identifying and breaking patterns that block spiritual freedom',
    pdfFilename: 'Breaking Strongholds Leader Guide.pdf',
  },
  {
    id: 'ministry-gift-test',
    name: 'Ministry Gift Test',
    description: 'Discovering how God has uniquely wired each disciple',
    pdfFilename: 'Ministry Gifts Leader Guide.pdf',
  },
  {
    id: 'confession',
    name: 'Confession',
    description: 'Walking in the light together — vertical and horizontal honesty',
    pdfFilename: 'Confession Leader Guide.pdf',
  },
  {
    id: 'simple-fellowship',
    name: 'Simple Fellowship',
    description: 'Creating space for unstructured, life-giving community',
    pdfFilename: 'Simple Fellowship Leader Guide.pdf',
  },
  {
    id: 'rest-sabbath',
    name: 'Rest / Sabbath',
    description: 'Practicing intentional rest as a spiritual discipline',
    pdfFilename: 'Rest Sabbath Leader Guide.pdf',
  },
  {
    id: 'worship-experience',
    name: 'Worship Experience',
    description: 'Leading the group into a dedicated time of corporate worship',
    pdfFilename: 'Worship Experience Leader Guide.pdf',
  },
  {
    id: 'qa-time',
    name: 'Q&A Time',
    description: 'Opening the floor for honest questions about faith and life',
    pdfFilename: 'Q&A Leader Guide.pdf',
  },
  {
    id: 'identity-shift',
    name: 'Identity Shift',
    description: 'Cementing who God says you are — not performance, not opinions',
    pdfFilename: 'Identity Shift Leader Guide.pdf',
  },
  {
    id: 'life-assessment-revisited',
    name: 'Life Assessment Revisited',
    description: 'Retaking the assessment to measure growth at the end of Phase 1',
    pdfFilename: 'Life Assessment Revisited Leader Guide.pdf',
  },
];

/**
 * Base URL for PDFs in Supabase Storage.
 * Update this once the `leader-guides` bucket is created.
 */
export const LEADER_GUIDES_STORAGE_URL = '/api/training/toolkit/pdf';
