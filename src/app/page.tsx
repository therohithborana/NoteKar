
"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Menu, FileText, Trash2, Settings, Search, ChevronsLeft } from "lucide-react";
import { cn } from "@/lib/utils";


type Note = {
  id: number;
  title: string;
  content: string;
};

const initialNotes: Note[] = [
    { id: 1, title: "Meeting Notes", content: "Discussed Q3 roadmap and new feature prioritization." },
    { id: 2, title: "Project Ideas", content: "Brainstormed ideas for the new marketing campaign." },
    { id: 3, title: "Personal Todos", content: "1. Buy groceries\n2. Schedule dentist appointment\n3. Finish reading book" },
];

export default function Home() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeNote, setActiveNote] = useState<Note | null>(notes[0] || null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);


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
  
  const SidebarContent = () => (
    <div className={cn("flex flex-col h-full bg-background text-foreground p-4", {
      "hidden": isDesktopSidebarCollapsed
    })}>
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Notes</h1>
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setIsDesktopSidebarCollapsed(true)}>
                <ChevronsLeft className="h-4 w-4"/>
            </Button>
        </div>

        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 bg-secondary/30" />
        </div>

        <Button variant="outline" className="w-full justify-start mb-4" onClick={createNewNote}>
            <Plus className="mr-2 h-4 w-4" />
            New Note
        </Button>
      
        <div className="flex-1 overflow-y-auto">
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
                            <FileText className="mr-2 h-4 w-4" />
                            <span className="truncate flex-1 text-left">{note.title}</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => deleteNote(note.id)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                ))}
            </nav>
        </div>
      
        <div className="mt-auto">
             <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
            </Button>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background dark">
      <aside 
        className={cn(
            "hidden md:block border-r border-border/60 transition-all duration-300 ease-in-out", 
            isDesktopSidebarCollapsed ? "w-16" : "w-64 lg:w-72"
        )}
      >
        {isDesktopSidebarCollapsed ? (
             <div className="flex flex-col items-center py-4">
                <Button variant="outline" size="icon" onClick={() => setIsDesktopSidebarCollapsed(false)}>
                    <Menu className="h-6 w-6" />
                </Button>
             </div>
        ) : (
            <SidebarContent />
        )}
      </aside>

      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden">
        <div className="flex items-center mb-4 md:hidden">
          {/* Mobile sidebar toggle */}
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
                <div className="flex flex-col h-full bg-background text-foreground p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold">Notes</h1>
                    </div>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search..." className="pl-9 bg-secondary/30" />
                    </div>

                    <Button variant="outline" className="w-full justify-start mb-4" onClick={createNewNote}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Note
                    </Button>
                
                    <div className="flex-1 overflow-y-auto">
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
                                        <FileText className="mr-2 h-4 w-4" />
                                        <span className="truncate flex-1 text-left">{note.title}</span>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => deleteNote(note.id)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </nav>
                    </div>
                
                    <div className="mt-auto">
                        <Button variant="ghost" className="w-full justify-start">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Button>
                    </div>
                </div>
            </SheetContent>
          </Sheet>

          <h1 className="text-xl font-bold ml-4">Notes</h1>
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
