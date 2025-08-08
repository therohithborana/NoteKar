import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

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


export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const drive = await getDriveClient(userId);
    const { notes } = await request.json();

    if (!notes) {
      return NextResponse.json({ error: 'No notes provided' }, { status: 400 });
    }

    const fileName = 'notes.json';
    const fileContent = JSON.stringify(notes);
    const readableFileContent = Readable.from(fileContent);

    // Check if the file already exists
    const res = await drive.files.list({
      q: `name='${fileName}' and 'appDataFolder' in parents`,
      spaces: 'appDataFolder',
      fields: 'files(id, name)',
    });

    const file = res.data.files?.[0];

    if (file && file.id) {
      // File exists, update it
      await drive.files.update({
        fileId: file.id,
        media: {
          mimeType: 'application/json',
          body: readableFileContent,
        },
      });
      return NextResponse.json({ success: true, message: 'File updated.' });
    } else {
      // File does not exist, create it
      await drive.files.create({
        requestBody: {
          name: fileName,
          parents: ['appDataFolder'],
        },
        media: {
          mimeType: 'application/json',
          body: readableFileContent,
        },
      });
      return NextResponse.json({ success: true, message: 'File created.' });
    }
  } catch (error: any) {
    console.error('Error syncing to drive:', error);
    // Check if it's an auth error from Clerk/Google
    if (error.message.includes('token') || error.message.includes('authenticate') || error.message.includes('Google account not found')) {
       return NextResponse.json({ error: 'Authentication failed. Please sign out, sign back in with Google, and ensure you grant Google Drive access.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to sync to Google Drive.' }, { status: 500 });
  }
}
