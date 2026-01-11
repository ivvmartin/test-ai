"use client";

import { FileText, Shield } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Link } from "@/lib/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@components/ui/sidebar";
import { PrivacyPolicyContent } from "./components/PrivacyPolicyContent";
import { TermsOfServiceContent } from "./components/TermsOfServiceContent";

type SectionId = "tos" | "pp";

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SubSection {
  id: string;
  title: string;
}

const navigationItems: NavItem[] = [
  { id: "tos", label: "Условия за ползване", icon: FileText },
  { id: "pp", label: "Политика за поверителност", icon: Shield },
];

const termsSubSections: SubSection[] = [
  { id: "tos-1", title: "1. Общи разпоредби" },
  { id: "tos-2", title: "2. Описание на услугата" },
  { id: "tos-3", title: "3. Регистрация и потребителски акаунт" },
  { id: "tos-4", title: "4. Потребителски нива и лимити" },
  { id: "tos-5", title: "5. Плащания и абонаменти" },
  { id: "tos-6", title: "6. Използване на услугата" },
  { id: "tos-7", title: "7. Интелектуална собственост" },
  { id: "tos-8", title: "8. Отговорност и гаранции" },
  { id: "tos-9", title: "9. Защита на личните данни" },
  { id: "tos-10", title: "10. Прекратяване на услугата" },
  { id: "tos-11", title: "11. Форсмажорни обстоятелства" },
  { id: "tos-12", title: "12. Приложимо право и спорове" },
  { id: "tos-13", title: "13. Общи разпоредби" },
  { id: "tos-14", title: "14. Контакти" },
];

const privacySubSections: SubSection[] = [
  { id: "pp-1", title: "1. Въведение" },
  { id: "pp-2", title: "2. Администратор на лични данни" },
  { id: "pp-3", title: "3. Какви лични данни събираме" },
  { id: "pp-4", title: "4. За какво използваме личните данни" },
  { id: "pp-5", title: "5. Важна информация за защита на поверителността" },
  { id: "pp-6", title: "6. Споделяне на лични данни с трети лица" },
  { id: "pp-7", title: "7. Срок на съхранение на личните данни" },
  { id: "pp-8", title: "8. Сигурност на личните данни" },
  { id: "pp-9", title: "9. Вашите права" },
  { id: "pp-10", title: "10. Cookies и подобни технологии" },
  { id: "pp-11", title: "11. Трансфер на данни извън ЕС/ЕИП" },
  { id: "pp-12", title: "12. Специфични разпоредби за AI системата" },
  { id: "pp-13", title: "13. Деца и непълнолетни" },
  { id: "pp-14", title: "14. Промени в политиката за поверителност" },
  { id: "pp-15", title: "15. Контакти за въпроси и заявки" },
  { id: "pp-16", title: "16. Заключение" },
];

export default function LegalPage() {
  return (
    <SidebarProvider defaultOpen={true}>
      <LegalPageContent />
    </SidebarProvider>
  );
}

function LegalPageContent() {
  const [activeSection, setActiveSection] = useState<SectionId>("tos");
  const [activeSubSection, setActiveSubSection] = useState<string>("");
  const [isScrolling, setIsScrolling] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    const updateSectionFromHash = () => {
      const hash = window.location.hash.slice(1);

      if (!hash) {
        setActiveSection("tos");
        setActiveSubSection("");
        return;
      }

      if (hash === "tos") {
        setActiveSection("tos");
        setActiveSubSection("");
      } else if (hash === "pp") {
        setActiveSection("pp");
        setActiveSubSection("");
      } else if (hash.startsWith("tos-")) {
        setActiveSection("tos");
        setActiveSubSection(hash);
        const element = document.getElementById(hash);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      } else if (hash.startsWith("pp-")) {
        setActiveSection("pp");
        setActiveSubSection(hash);
        const element = document.getElementById(hash);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      }
    };

    updateSectionFromHash();
    window.addEventListener("hashchange", updateSectionFromHash);
    return () =>
      window.removeEventListener("hashchange", updateSectionFromHash);
  }, []);

  // Scroll spy: track visible sections for sidebar highlighting
  useEffect(() => {
    const currentSubSections =
      activeSection === "tos" ? termsSubSections : privacySubSections;
    const currentSectionIds = currentSubSections.map((s) => s.id);

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const visibleEntry = entries.find((entry) => entry.isIntersecting);

      if (visibleEntry && !isScrolling) {
        const sectionId = visibleEntry.target.id;
        setActiveSubSection(sectionId);
      }
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    currentSectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    // Handle bottom scroll - activate last section
    const handleScroll = () => {
      if (isScrolling) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Check if scrolled to bottom (within 50px threshold)
      if (scrollTop + windowHeight >= documentHeight - 50) {
        const lastSubSection =
          currentSubSections[currentSubSections.length - 1];
        if (lastSubSection) {
          setActiveSubSection(lastSubSection.id);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isScrolling, activeSection]);

  const handleSectionClick = (sectionId: SectionId) => {
    setIsScrolling(true);
    setActiveSection(sectionId);
    setActiveSubSection("");

    // Reset scroll position to top when switching main sections
    window.scrollTo({ top: 0, behavior: "instant" });

    window.history.replaceState(null, "", `#${sectionId}`);
    if (isMobile) setOpenMobile(false);
    setTimeout(() => setIsScrolling(false), 500);
  };

  const handleSubSectionClick = (subsectionId: string) => {
    setIsScrolling(true);
    window.location.hash = subsectionId;
    if (isMobile) setOpenMobile(false);
    setTimeout(() => setIsScrolling(false), 1000);
  };

  return (
    <div className="flex min-h-screen w-full bg-neutral-50 dark:bg-neutral-950">
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader className="border-b p-[11px]">
          <Link
            href="/"
            className="flex items-center gap-3 px-2 cursor-pointer transition-transform hover:scale-101"
          >
            <span className="text-lg font-bold text-neutral-900 dark:text-white">
              EVTA AI
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="pb-12">
          <SidebarGroup>
            <SidebarGroupLabel>Правна информация</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => {
                  const subsections =
                    item.id === "tos" ? termsSubSections : privacySubSections;
                  const isActive = activeSection === item.id;

                  return (
                    <div key={item.id}>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => handleSectionClick(item.id)}
                          tooltip={item.label}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {isActive && (
                        <div className="ml-6 mt-1 space-y-1 border-l border-neutral-200 pl-3 pr-2 dark:border-neutral-800">
                          {subsections.map((subsection) => {
                            const isSubActive =
                              activeSubSection === subsection.id;
                            return (
                              <button
                                key={subsection.id}
                                onClick={() =>
                                  handleSubSectionClick(subsection.id)
                                }
                                className={`block w-full py-1.5 pr-2 text-left text-xs transition-colors break-words ${
                                  isSubActive
                                    ? "font-medium text-neutral-900 dark:text-white"
                                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                                }`}
                              >
                                {subsection.title}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950 lg:hidden">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-neutral-900 dark:text-white">
              Правна информация
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-8 py-12">
            <ContentSection activeSection={activeSection} />
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}

interface SectionHeadingProps {
  id: string;
  children: React.ReactNode;
}

export function SectionHeading({ id, children }: SectionHeadingProps) {
  return (
    <h2
      id={id}
      className="mb-4 mt-8 scroll-mt-24 text-2xl font-bold text-neutral-900 dark:text-white"
    >
      {children}
    </h2>
  );
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-5 text-base font-semibold text-neutral-900 dark:text-white">
      {children}
    </h3>
  );
}

interface ContentSectionProps {
  activeSection: SectionId;
}

function ContentSection({ activeSection }: ContentSectionProps) {
  if (activeSection === "tos") return <TermsOfServiceContent />;
  if (activeSection === "pp") return <PrivacyPolicyContent />;
  return null;
}
