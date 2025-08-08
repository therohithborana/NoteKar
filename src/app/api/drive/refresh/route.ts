import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const getDriveClient = async (userId: string) => {
  const clerkUser = await clerkClient.users.getUser(userId);
  const googleAccount = clerkUser.externalAccounts.find(acc => acc.provider === 'oauth_google');
  
  if (!googleAccount || !googleAccount.accessToken) {
    throw new Error('Google access token not found. Please re-authenticate with Google.');
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: googleAccount.accessToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
};

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const drive = await getDriveClient(userId);
    const fileName = 'notes.json';

    // Find the file in the appDataFolder
    const res = await drive.files.list({
      q: `name='${fileName}' and 'appDataFolder' in parents`,
      spaces: 'appDataFolder',
      fields: 'files(id, name)',
    });

    const file = res.data.files?.[0];

    if (!file || !file.id) {
      return NextResponse.json({ notes: null }, { status: 200 });
    }

    // File found, download its content
    const fileRes = await drive.files.get(
      { fileId: file.id, alt: 'media' },
      { responseType: 'json' }
    );
    
    // The data is in fileRes.data
    return NextResponse.json({ notes: fileRes.data });

  } catch (error: any) {
    console.error('Error refreshing from drive:', error);
    if (error.message.includes('token') || error.message.includes('authenticate') || error.message.includes('Google account not found')) {
       return NextResponse.json({ error: 'Authentication failed. Please sign out, sign back in with Google, and ensure you grant Google Drive access.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to refresh from Google Drive.' }, { status: 500 });
  }
}
