
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, VenetianMask, Layers, Zap, BookOpenCheck } from "lucide-react"

const features = [
  {
    icon: <VenetianMask className="w-8 h-8 text-primary" />,
    title: "Glassmorphism UI",
    description: "A beautiful, semi-transparent interface that floats gracefully over any webpage.",
  },
  {
    icon: <Layers className="w-8 h-8 text-primary" />,
    title: "Draggable & Resizable",
    description: "Move and resize your notes panel to the perfect spot on your screen.",
  },
  {
    icon: <Zap className="w-8 h-8 text-primary" />,
    title: "Instant & Persistent",
    description: "Notes are auto-saved with every keystroke and stored per-domain, ready when you return.",
  },
  {
    icon: <BookOpenCheck className="w-8 h-8 text-primary" />,
    title: "Simple & Powerful",
    description: "All the features you need, like hotkey toggling and transparency control, in a minimal package.",
  },
]

const installSteps = [
    {
        step: "1. Get the Extension Files",
        description: "The extension files have been added to the 'public/extension' folder in this project. There's no need to download anything separately.",
    },
    {
        step: "2. Open Chrome Extensions",
        description: "In your Chrome browser, navigate to chrome://extensions or find it under 'More Tools' in the main menu.",
    },
    {
        step: "3. Enable Developer Mode",
        description: "In the top-right corner of the extensions page, toggle the 'Developer mode' switch on.",
    },
    {
        step: "4. Load Unpacked",
        description: "Click the 'Load unpacked' button that appears. A file dialog will open. Navigate to and select the 'public/extension' folder from this project.",
    },
    {
        step: "5. Ready to Go!",
        description: "Glass Pane Notes will now appear in your extensions list! Use Alt+N or click the extension icon to start taking notes on any page.",
    }
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/10">
          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline text-primary">
                Glass Pane Notes
              </h1>
              <p className="text-lg text-foreground/80 md:text-xl">
                Your thoughts, captured seamlessly. A floating, semi-transparent notes panel for every webpage.
              </p>
              <Button size="lg" className="font-semibold" asChild>
                <a href="#installation">
                    <Download className="mr-2 h-5 w-5" />
                    Installation Guide
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-center text-center space-y-3">
                  {feature.icon}
                  <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="installation" className="w-full py-12 md:py-24 lg:py-32 bg-primary/10">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
                    Installation Guide
                </h2>
                <p className="mt-4 text-muted-foreground md:text-xl">
                    Follow these simple steps to install your new favorite note-taking tool.
                </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {installSteps.map((step, index) => (
                  <Card key={index} className="bg-background/80 backdrop-blur-sm">
                      <CardHeader>
                          <CardTitle className="text-accent">{step.step}</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-foreground/90">{step.description}</p>
                      </CardContent>
                  </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="flex items-center justify-center w-full h-20 border-t">
        <p className="text-muted-foreground">© {new Date().getFullYear()} Glass Pane Notes. All rights reserved.</p>
      </footer>
    </div>
  )
}
