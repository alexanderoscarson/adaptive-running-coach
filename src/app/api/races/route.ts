import { NextRequest, NextResponse } from 'next/server';

export interface Race {
  id: string;
  name: string;
  location: string;
  country: string;
  date: string;
  distance: '5k' | '10k' | 'half_marathon' | 'marathon';
  url?: string;
}

// Curated database of popular races worldwide — grouped by distance
const RACES: Race[] = [
  // Marathons
  { id: 'nyc-marathon', name: 'TCS New York City Marathon', location: 'New York, NY', country: 'USA', date: '2026-11-01', distance: 'marathon' },
  { id: 'boston-marathon', name: 'Boston Marathon', location: 'Boston, MA', country: 'USA', date: '2026-04-20', distance: 'marathon' },
  { id: 'chicago-marathon', name: 'Chicago Marathon', location: 'Chicago, IL', country: 'USA', date: '2026-10-11', distance: 'marathon' },
  { id: 'london-marathon', name: 'TCS London Marathon', location: 'London', country: 'UK', date: '2026-04-26', distance: 'marathon' },
  { id: 'berlin-marathon', name: 'BMW Berlin Marathon', location: 'Berlin', country: 'Germany', date: '2026-09-27', distance: 'marathon' },
  { id: 'tokyo-marathon', name: 'Tokyo Marathon', location: 'Tokyo', country: 'Japan', date: '2027-03-07', distance: 'marathon' },
  { id: 'paris-marathon', name: 'Schneider Electric Marathon de Paris', location: 'Paris', country: 'France', date: '2026-04-05', distance: 'marathon' },
  { id: 'stockholm-marathon', name: 'ASICS Stockholm Marathon', location: 'Stockholm', country: 'Sweden', date: '2026-06-06', distance: 'marathon' },
  { id: 'gothenburg-marathon', name: 'Göteborgsvarvet Marathon', location: 'Gothenburg', country: 'Sweden', date: '2026-05-16', distance: 'marathon' },
  { id: 'valencia-marathon', name: 'Valencia Marathon', location: 'Valencia', country: 'Spain', date: '2026-12-06', distance: 'marathon' },
  { id: 'amsterdam-marathon', name: 'TCS Amsterdam Marathon', location: 'Amsterdam', country: 'Netherlands', date: '2026-10-18', distance: 'marathon' },
  { id: 'dubai-marathon', name: 'Dubai Marathon', location: 'Dubai', country: 'UAE', date: '2027-01-22', distance: 'marathon' },
  { id: 'marine-corps-marathon', name: 'Marine Corps Marathon', location: 'Washington, D.C.', country: 'USA', date: '2026-10-25', distance: 'marathon' },
  { id: 'rome-marathon', name: 'Rome Marathon', location: 'Rome', country: 'Italy', date: '2026-03-22', distance: 'marathon' },
  { id: 'copenhagen-marathon', name: 'Copenhagen Marathon', location: 'Copenhagen', country: 'Denmark', date: '2026-05-17', distance: 'marathon' },
  { id: 'sydney-marathon', name: 'Sydney Marathon', location: 'Sydney', country: 'Australia', date: '2026-09-20', distance: 'marathon' },
  { id: 'melbourne-marathon', name: 'Melbourne Marathon', location: 'Melbourne', country: 'Australia', date: '2026-10-11', distance: 'marathon' },

  // Half Marathons
  { id: 'gothenburg-half', name: 'Göteborgsvarvet', location: 'Gothenburg', country: 'Sweden', date: '2026-05-16', distance: 'half_marathon' },
  { id: 'stockholm-half', name: 'Stockholm Half Marathon', location: 'Stockholm', country: 'Sweden', date: '2026-09-12', distance: 'half_marathon' },
  { id: 'nyc-half', name: 'United Airlines NYC Half', location: 'New York, NY', country: 'USA', date: '2026-03-15', distance: 'half_marathon' },
  { id: 'great-north-run', name: 'Great North Run', location: 'Newcastle', country: 'UK', date: '2026-09-13', distance: 'half_marathon' },
  { id: 'copenhagen-half', name: 'Copenhagen Half Marathon', location: 'Copenhagen', country: 'Denmark', date: '2026-09-20', distance: 'half_marathon' },
  { id: 'lisbon-half', name: 'Lisbon Half Marathon', location: 'Lisbon', country: 'Portugal', date: '2026-03-22', distance: 'half_marathon' },
  { id: 'berlin-half', name: 'Berlin Half Marathon', location: 'Berlin', country: 'Germany', date: '2026-04-05', distance: 'half_marathon' },
  { id: 'paris-half', name: 'Paris Half Marathon', location: 'Paris', country: 'France', date: '2026-03-01', distance: 'half_marathon' },
  { id: 'barcelona-half', name: 'Barcelona Half Marathon', location: 'Barcelona', country: 'Spain', date: '2026-02-15', distance: 'half_marathon' },
  { id: 'amsterdam-half', name: 'Dam tot Damloop', location: 'Amsterdam', country: 'Netherlands', date: '2026-09-20', distance: 'half_marathon' },
  { id: 'delhi-half', name: 'Airtel Delhi Half Marathon', location: 'New Delhi', country: 'India', date: '2026-11-29', distance: 'half_marathon' },
  { id: 'valencia-half', name: 'Valencia Half Marathon', location: 'Valencia', country: 'Spain', date: '2026-10-25', distance: 'half_marathon' },
  { id: 'tokyo-half', name: 'Marugame Half Marathon', location: 'Kagawa', country: 'Japan', date: '2027-02-07', distance: 'half_marathon' },
  { id: 'prague-half', name: 'Prague Half Marathon', location: 'Prague', country: 'Czech Republic', date: '2026-04-04', distance: 'half_marathon' },
  { id: 'chicago-half', name: 'Chicago Half Marathon', location: 'Chicago, IL', country: 'USA', date: '2026-09-27', distance: 'half_marathon' },
  { id: 'malmo-half', name: 'Malmö Half Marathon', location: 'Malmö', country: 'Sweden', date: '2026-09-05', distance: 'half_marathon' },

  // 10K
  { id: 'midnattsloppet', name: 'Midnattsloppet Stockholm', location: 'Stockholm', country: 'Sweden', date: '2026-08-15', distance: '10k' },
  { id: 'bay-to-breakers', name: 'Bay to Breakers', location: 'San Francisco, CA', country: 'USA', date: '2026-05-17', distance: '10k' },
  { id: 'dam-tot-dam-10', name: 'Dam tot Dam 10K', location: 'Amsterdam', country: 'Netherlands', date: '2026-09-20', distance: '10k' },
  { id: 'bolder-boulder', name: 'BOLDERBoulder', location: 'Boulder, CO', country: 'USA', date: '2026-05-25', distance: '10k' },
  { id: 'london-10k', name: 'Asics London 10K', location: 'London', country: 'UK', date: '2026-07-12', distance: '10k' },
  { id: 'paris-10k', name: 'Paris 10K', location: 'Paris', country: 'France', date: '2026-06-07', distance: '10k' },
  { id: 'peachtree', name: 'AJC Peachtree Road Race', location: 'Atlanta, GA', country: 'USA', date: '2026-07-04', distance: '10k' },
  { id: 'berlin-10k', name: 'Berlin 10K', location: 'Berlin', country: 'Germany', date: '2026-05-03', distance: '10k' },
  { id: 'manchester-10k', name: 'Great Manchester Run', location: 'Manchester', country: 'UK', date: '2026-05-24', distance: '10k' },

  // 5K
  { id: 'color-run-stockholm', name: 'The Color Run Stockholm', location: 'Stockholm', country: 'Sweden', date: '2026-06-20', distance: '5k' },
  { id: 'jpmorgan-cc', name: 'J.P. Morgan Corporate Challenge', location: 'Various', country: 'Global', date: '2026-06-01', distance: '5k' },
  { id: 'parkrun', name: 'parkrun (weekly)', location: 'Worldwide', country: 'Global', date: '2026-01-01', distance: '5k' },
  { id: 'couch-to-5k-race', name: 'Race for Life 5K', location: 'Various', country: 'UK', date: '2026-07-01', distance: '5k' },
  { id: 'foam-fest-5k', name: 'Foam Fest 5K', location: 'Various', country: 'USA', date: '2026-06-15', distance: '5k' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';
  const distance = searchParams.get('distance');

  let results = RACES;

  if (distance) {
    results = results.filter(r => r.distance === distance);
  }

  if (query) {
    results = results.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.location.toLowerCase().includes(query) ||
      r.country.toLowerCase().includes(query)
    );
  }

  // Sort by date
  results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json(results.slice(0, 20));
}
