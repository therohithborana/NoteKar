"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Plus, Menu, FileText, Trash2, Search, X, UploadCloud, DownloadCloud, LogIn, ChevronsLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, UserButton, SignInButton, useSession } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";


type Note = {
  id: number;
  title: string;
  content: string;
};

const initialNotes: Note[] = [
    { id: 1, title: "Welcome!", content: "This is your first note. You can edit it, create new notes, and sync to Google Drive after signing in." },
];

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [driveStatus, setDriveStatus] = useState<'checking' | 'connected' | 'missing_permissions' | 'none'>('none');

  const { isSignedIn, user } = useUser();
  const { session } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (isSignedIn && session) {
      setDriveStatus('checking');
      // This is a simplified check. A real app might make an API call to the backend
      // to verify the token's scopes against the Google API.
      // We are checking if the google scope for drive is present.
      const provider = session.publicUserData?.externalAccounts?.find(a => a.provider === 'oauth_google');
      if (provider && provider.approvedScopes.includes('https://www.googleapis.com/auth/drive.appdata')) {
        setDriveStatus('connected');
      } else {
        setDriveStatus('missing_permissions');
      }
    } else {
      setDriveStatus('none');
    }
  }, [isSignedIn, session]);

  // Load notes from localStorage on initial render
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedNotes = localStorage.getItem('notes-data');
        if (savedNotes) {
          const parsedNotes = JSON.parse(savedNotes);
          if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
            setNotes(parsedNotes);
            setActiveNote(parsedNotes[0]);
          } else {
             setNotes(initialNotes);
             setActiveNote(initialNotes[0]);
          }
        } else {
          setNotes(initialNotes);
          setActiveNote(initialNotes[0]);
        }
      }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        setNotes(initialNotes);
        setActiveNote(initialNotes[0]);
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && notes.length > 0) {
      localStorage.setItem('notes-data', JSON.stringify(notes));
    }
  }, [notes]);


  // Effect to handle contextual notes from extension
  useEffect(() => {
    if (typeof window !== 'undefined' && window.chrome && chrome.storage) {
      const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
        if (changes.newNoteContent) {
           const newNote: Note = {
             id: Date.now(),
             title: "New Note from page",
             content: changes.newNoteContent.newValue,
           };
           setNotes(prevNotes => {
             const updatedNotes = [newNote, ...prevNotes];
             setActiveNote(newNote);
             return updatedNotes;
           });
           chrome.storage.local.remove("newNoteContent");
        }
      };
      chrome.storage.onChanged.addListener(handleStorageChange);
  
      // Initial check in case the value was set before the listener was added
      chrome.storage.local.get("newNoteContent", (data) => {
        if (data.newNoteContent) {
          const newNote: Note = {
            id: Date.now(),
            title: "New Note from page",
            content: data.newNoteContent,
          };
          setNotes(prevNotes => {
            const updatedNotes = [newNote, ...prevNotes];
            setActiveNote(newNote);
            return updatedNotes;
          });
          chrome.storage.local.remove("newNoteContent");
        }
      });

      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    }
  }, []);

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now(),
      title: "Untitled Note",
      content: "",
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
    if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
    }
  };

  const deleteNote = (id: number) => {
    const newNotes = notes.filter(n => n.id !== id);
    setNotes(newNotes);
    if (activeNote?.id === id) {
      setActiveNote(newNotes[0] || null);
    }
  };

  const handleNoteChange = (field: 'title' | 'content', value: string) => {
    if (activeNote) {
      const updatedNote = { ...activeNote, [field]: value };
      setActiveNote(updatedNote);
      setNotes(notes.map(n => n.id === activeNote.id ? updatedNote : n));
    }
  };

  const handleAuthError = (error: any) => {
    const description = "Authentication failed. The app is missing permissions for Google Drive. Please sign out and sign back in, making sure to grant Google Drive access when prompted.";
    toast({ title: "Google Drive Sync Error", description, variant: "destructive" });
  };

  const syncToDrive = async () => {
    if (!isSignedIn) {
      toast({ title: "Please sign in to sync.", variant: "destructive" });
      return;
    }
    if (driveStatus !== 'connected') {
      handleAuthError(null);
      return;
    }
    setIsSyncing(true);
    try {
      const response = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync to Google Drive');
      }
      toast({ title: "Successfully synced to Google Drive!" });
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshFromDrive = async () => {
    if (!isSignedIn) {
      toast({ title: "Please sign in to refresh.", variant: "destructive" });
      return;
    }
     if (driveStatus !== 'connected') {
      handleAuthError(null);
      return;
    }
    setIsSyncing(true);
    try {
      const response = await fetch('/api/drive/refresh');
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to refresh from Google Drive');
      }
      if (result.notes) {
        setNotes(result.notes);
        setActiveNote(result.notes[0] || null);
        toast({ title: "Successfully refreshed from Google Drive!" });
      } else {
        toast({ title: "No notes file found in Google Drive." });
      }
    } catch (error: any) {
       handleAuthError(error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const SidebarHeader = () => (
    <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <FileText className="h-6 w-6"/>
                <h1 className="text-xl font-bold">Notes</h1>
            </div>
             <Button variant="ghost" size="icon" onClick={() => setIsDesktopSidebarCollapsed(true)} className="hidden md:inline-flex">
                <ChevronsLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden">
                <X className="h-5 w-5" />
            </Button>
        </div>
        <div className="flex items-center gap-2">
            {isSignedIn ? <UserButton afterSignOutUrl="/"/> : (
              <SignInButton mode="modal">
                <Button size="sm" variant="outline" className="w-full">
                  <LogIn className="mr-2 h-4 w-4"/>
                  Sign In
                </Button>
              </SignInButton>
            )}
        </div>
    </div>
  );

  const DriveStatusIndicator = () => {
    if (!isSignedIn) return null;

    let statusContent;
    switch (driveStatus) {
        case 'connected':
            statusContent = (
                <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="h-4 w-4"/>
                    <span className="text-xs font-medium">Drive Connected</span>
                </div>
            );
            break;
        case 'missing_permissions':
             statusContent = (
                <div className="flex items-center gap-2 text-yellow-500">
                    <AlertCircle className="h-4 w-4"/>
                    <span className="text-xs font-medium">Drive access required</span>
                </div>
            );
            break;
        default:
             statusContent = <div className="h-6"></div>; // Placeholder for layout consistency
    }
    return <div className="px-4 pb-2">{statusContent}</div>
  }

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className={cn("flex flex-col h-full bg-background text-foreground transition-all duration-300")}>
       {!collapsed ? <SidebarHeader /> : null}

        {!collapsed && <DriveStatusIndicator/>}

        {!collapsed && (
          <div className="relative mb-2 px-4">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 bg-secondary/30" />
          </div>
        )}

        <div className="px-4">
          <Button variant="outline" className={cn("w-full justify-start mb-4", collapsed && "justify-center")} onClick={createNewNote}>
              <Plus className={cn("mr-2 h-4 w-4", collapsed && "mr-0")} />
              {!collapsed && <span>New Note</span>}
          </Button>
        </div>
      
        <div className="flex-1 overflow-y-auto px-4">
            <nav className="flex flex-col gap-1">
                {notes.map(note => (
                    <div key={note.id} className="group flex items-center">
                        <Button
                            variant={activeNote?.id === note.id ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                setActiveNote(note);
                                if (isMobileSidebarOpen) {
                                    setIsMobileSidebarOpen(false);
                                }
                            }}
                        >
                            <FileText className={cn("mr-2 h-4 w-4", collapsed && "mr-0")} />
                            {!collapsed && <span className="truncate flex-1 text-left">{note.title}</span>}
                        </Button>
                         {!collapsed && (
                           <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => deleteNote(note.id)}>
                               <Trash2 className="h-4 w-4"/>
                           </Button>
                         )}
                    </div>
                ))}
            </nav>
        </div>

        <div className="mt-auto p-4">
          {isSignedIn && !collapsed && (
             <div className="flex flex-col gap-2">
                 <Button variant="ghost" className="justify-start" onClick={syncToDrive} disabled={isSyncing}>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    <span>{isSyncing ? 'Syncing...' : 'Sync to Drive'}</span>
                 </Button>
                 <Button variant="ghost" className="justify-start" onClick={refreshFromDrive} disabled={isSyncing}>
                    <DownloadCloud className="mr-2 h-4 w-4" />
                    <span>{isSyncing ? 'Refreshing...' : 'Refresh from Drive'}</span>
                 </Button>
             </div>
          )}
        </div>
    </div>
  );

  return (
    <div className="flex h-screen dark bg-background">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
            "hidden md:flex flex-col border-r border-border/60 transition-all duration-300 ease-in-out bg-background", 
            isDesktopSidebarCollapsed ? "w-20" : "w-72"
        )}
      >
        {isDesktopSidebarCollapsed ? (
             <div className="flex flex-col items-center py-4 h-full">
                <Button variant="ghost" size="icon" onClick={() => setIsDesktopSidebarCollapsed(false)} className="mb-4">
                    <Menu className="h-5 w-5" />
                </Button>
                 <Button variant="ghost" size="icon" onClick={createNewNote} className="mb-4">
                    <Plus className="h-5 w-5" />
                </Button>
                <div className="flex-1 overflow-y-auto flex flex-col items-center gap-2">
                   {notes.slice(0, 10).map(note => (
                       <Button key={note.id} variant={activeNote?.id === note.id ? "secondary" : "ghost"} size="icon" onClick={() => setActiveNote(note)}>
                           <FileText className="h-5 w-5"/>
                       </Button>
                   ))}
                </div>
                <div className="mt-auto">
                  {isSignedIn ? <UserButton /> : (
                    <SignInButton mode="modal">
                      <Button variant="ghost" size="icon"><LogIn/></Button>
                    </SignInButton>
                  )}
                </div>
             </div>
        ) : (
            <SidebarContent collapsed={false} />
        )}
      </aside>

      {/* Mobile Sidebar */}
       <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetContent side="left" className="p-0 w-72 md:hidden bg-background">
              <SheetHeader className="hidden">
                <SheetTitle>Sidebar</SheetTitle>
                <SheetDescription>Notes and settings</SheetDescription>
              </SheetHeader>
              <SidebarContent collapsed={false} />
            </SheetContent>
          </Sheet>

      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden bg-background">
        <div className="flex items-center mb-4 md:hidden">
          <Button variant="outline" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold ml-4">{isSignedIn ? `${user?.firstName}'s Notes` : "Notes"}</h1>
        </div>
        
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full">
            <Input
              value={activeNote.title}
              onChange={(e) => handleNoteChange('title', e.target.value)}
              placeholder="Untitled Note"
              className="text-3xl font-bold border-none focus:ring-0 shadow-none p-0 mb-4 h-auto bg-transparent"
            />
            <Textarea
              value={activeNote.content}
              onChange={(e) => handleNoteChange('content', e.target.value)}
              placeholder="Start writing..."
              className="flex-1 text-base border-none focus:ring-0 shadow-none p-0 resize-none bg-transparent"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold">No note selected</h2>
            <p className="text-muted-foreground mb-4">Create a new note or select one from the sidebar.</p>
            <Button onClick={createNewNote} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create a Note
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
