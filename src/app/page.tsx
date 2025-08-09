"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Plus, Menu, FileText, Trash2, Search, X, Brush } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';

const DrawingCanvas = dynamic(() => import('@/components/DrawingCanvas'), { ssr: false });

type Note = {
  id: number;
  title: string;
  content: string | null;
  drawing: string | null;
  type: 'text' | 'drawing';
};

const initialNotes: Note[] = [
    { id: 1, title: "Welcome!", content: "This is your first note. You can edit it or create new notes.", drawing: null, type: 'text' },
];

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false)

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    setIsClient(true)
  }, [])


  // Load notes from localStorage on initial render
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedNotes = localStorage.getItem('notes-data');
        let notesToLoad: Note[] = initialNotes;
        if (savedNotes) {
            const parsedNotes = JSON.parse(savedNotes);
            if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
                // Quick migration for old note format
                notesToLoad = parsedNotes.map(note => {
                    if (typeof note.type === 'undefined') {
                        return { ...note, type: 'text', drawing: null };
                    }
                    return note;
                });
            }
        }
        setNotes(notesToLoad);
        if (notesToLoad.length > 0) {
            setActiveNoteId(notesToLoad[0].id);
        }
      }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        setNotes(initialNotes);
        if (initialNotes.length > 0) {
          setActiveNoteId(initialNotes[0].id);
        }
    }
  }, []);

  const activeNote = notes.find(n => n.id === activeNoteId);

  // Effect to handle contextual notes from extension
  useEffect(() => {
    if (typeof window !== 'undefined' && window.chrome && chrome.storage) {
      const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
        if (changes.newNoteContent) {
           const newNote: Note = {
             id: Date.now(),
             title: "New Note from page",
             content: changes.newNoteContent.newValue,
             drawing: null,
             type: 'text',
           };
           const updatedNotes = [newNote, ...notes];
           setNotes(updatedNotes);
           setActiveNoteId(newNote.id);
           saveNotes(updatedNotes);
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
            drawing: null,
            type: 'text',
          };
          const updatedNotes = [newNote, ...notes];
          setNotes(updatedNotes);
setActiveNoteId(newNote.id);
saveNotes(updatedNotes);
          chrome.storage.local.remove("newNoteContent");
        }
      });

      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    }
  }, [notes]);

  const saveNotes = (updatedNotes: Note[]) => {
      if (typeof window !== 'undefined') {
          localStorage.setItem('notes-data', JSON.stringify(updatedNotes));
      }
  };

  const createNewNote = (type: 'text' | 'drawing') => {
    const newNote: Note = {
      id: Date.now(),
      title: type === 'text' ? "Untitled Note" : "New Drawing",
      content: type === 'text' ? "" : null,
      drawing: type === 'drawing' ? '{"elements":[]}' : null,
      type: type,
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setActiveNoteId(newNote.id);
    saveNotes(updatedNotes);

    if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
    }
  };

  const deleteNote = (id: number) => {
    const newNotes = notes.filter(n => n.id !== id);
    setNotes(newNotes);
    if (activeNoteId === id) {
      const newActiveId = newNotes[0]?.id || null;
      setActiveNoteId(newActiveId);
    }
    saveNotes(newNotes);
  };
  
  const handleNoteChange = (field: 'title' | 'content' | 'drawing', value: string) => {
      if (activeNote) {
        const updatedNotes = notes.map(n => n.id === activeNoteId ? {...n, [field]: value} : n);
        setNotes(updatedNotes);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            saveNotes(updatedNotes);
        }, 500);
      }
  }
  
  const SidebarHeader = () => (
    <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <FileText className="h-6 w-6"/>
                <h1 className="text-xl font-bold">Notes</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden">
                <X className="h-5 w-5" />
            </Button>
        </div>
    </div>
  );

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className={cn("flex flex-col h-full bg-background text-foreground transition-all duration-300")}>
       {!collapsed ? <SidebarHeader /> : null}

        {!collapsed && (
          <div className="relative mb-2 px-4">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 bg-secondary/30" />
          </div>
        )}

        <div className="px-4 flex flex-col gap-2">
          <Button variant="outline" className={cn("w-full justify-start", collapsed && "justify-center")} onClick={() => createNewNote('text')}>
              <Plus className={cn("mr-2 h-4 w-4", collapsed && "mr-0")} />
              {!collapsed && <span>New Note</span>}
          </Button>
          <Button variant="outline" className={cn("w-full justify-start", collapsed && "justify-center")} onClick={() => createNewNote('drawing')}>
              <Brush className={cn("mr-2 h-4 w-4", collapsed && "mr-0")} />
              {!collapsed && <span>New Drawing</span>}
          </Button>
        </div>
      
        <div className="flex-1 overflow-y-auto px-4 mt-4">
            <nav className="flex flex-col gap-1">
                {notes.map(note => (
                    <div key={note.id} className="group flex items-center">
                        <Button
                            variant={activeNoteId === note.id ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                setActiveNoteId(note.id);
                                if (isMobileSidebarOpen) {
                                    setIsMobileSidebarOpen(false);
                                }
                            }}
                        >
                            {note.type === 'drawing' ? <Brush className={cn("mr-2 h-4 w-4", collapsed && "mr-0")} /> : <FileText className={cn("mr-2 h-4 w-4", collapsed && "mr-0")} />}
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
                 <Button variant="ghost" size="icon" onClick={() => createNewNote('text')} className="mb-2">
                    <Plus className="h-5 w-5" />
                </Button>
                 <Button variant="ghost" size="icon" onClick={() => createNewNote('drawing')} className="mb-4">
                    <Brush className="h-5 w-5" />
                </Button>
                <div className="flex-1 overflow-y-auto flex flex-col items-center gap-2">
                   {notes.slice(0, 10).map(note => (
                       <Button key={note.id} variant={activeNoteId === note.id ? "secondary" : "ghost"} size="icon" onClick={() => setActiveNoteId(note.id)}>
                           {note.type === 'drawing' ? <Brush className="h-5 w-5"/> : <FileText className="h-5 w-5"/>}
                       </Button>
                   ))}
                </div>
                <div className="mt-auto">
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
          <h1 className="text-xl font-bold ml-4">Notes</h1>
        </div>
        
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            <Input
              value={activeNote.title}
              onChange={(e) => handleNoteChange('title', e.target.value)}
              placeholder={activeNote.type === 'text' ? "Untitled Note" : "New Drawing"}
              className="text-3xl font-bold border-none focus:ring-0 shadow-none p-0 mb-4 h-auto bg-transparent"
            />
            {activeNote.type === 'text' ? (
                <Textarea
                  value={activeNote.content || ''}
                  onChange={(e) => handleNoteChange('content', e.target.value)}
                  placeholder="Start writing..."
                  className="flex-1 text-base border-none focus:ring-0 shadow-none p-0 bg-transparent resize-none"
                />
            ) : (
                isClient && activeNote.drawing && (
                    <div className="flex-1 w-full h-full relative">
                        <DrawingCanvas
                            initialData={activeNote.drawing}
                            onChange={(data) => handleNoteChange('drawing', data)}
                        />
                    </div>
                )
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold">No note selected</h2>
            <p className="text-muted-foreground mb-4">Create a new note or select one from the sidebar.</p>
            <Button onClick={() => createNewNote('text')} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create a Note
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
