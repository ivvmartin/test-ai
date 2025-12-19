"use client";

import { FileText, Hash, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@/lib/navigation";

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
} from "@/components/ui/sidebar";

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
  { id: "tos", label: "Terms of Service", icon: FileText },
  { id: "pp", label: "Privacy Policy", icon: Shield },
];

const termsSubSections: SubSection[] = [
  { id: "tos-service-description", title: "1. Service Description" },
  { id: "tos-user-obligations", title: "2. User Obligations" },
  { id: "tos-intellectual-property", title: "3. Intellectual Property" },
  { id: "tos-limitation-liability", title: "4. Limitation of Liability" },
  { id: "tos-termination", title: "5. Termination" },
];

const privacySubSections: SubSection[] = [
  { id: "pp-information-collect", title: "1. Information We Collect" },
  { id: "pp-use-information", title: "2. How We Use Your Information" },
  { id: "pp-data-security", title: "3. Data Security" },
  { id: "pp-information-sharing", title: "4. Information Sharing" },
  { id: "pp-your-rights", title: "5. Your Rights" },
  { id: "pp-changes-policy", title: "6. Changes to This Policy" },
];

interface SectionHeadingProps {
  id: string;
  children: React.ReactNode;
}

function SectionHeading({ id, children }: SectionHeadingProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAnchorClick = () => {
    const newUrl = `${location.pathname}#${id}`;
    navigate(newUrl, { replace: true });

    // Copy link to clipboard
    const fullUrl = `${window.location.origin}${newUrl}`;
    navigator.clipboard.writeText(fullUrl);
  };

  return (
    <h2
      id={id}
      className="group relative mb-4 mt-8 scroll-mt-24 text-2xl font-bold text-neutral-900 dark:text-white"
    >
      <button
        onClick={handleAnchorClick}
        className="absolute -left-8 top-0 flex h-full items-center opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Copy link to section"
      >
        <Hash className="h-5 w-5 text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300" />
      </button>
      {children}
    </h2>
  );
}

export default function LegalPage() {
  return (
    <SidebarProvider defaultOpen={true}>
      <LegalPageContent />
    </SidebarProvider>
  );
}

function LegalPageContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionId>("tos");
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    // Handle initial hash on mount
    const hash = location.hash.slice(1);
    if (hash) {
      // Handle main section hashes (tos or pp)
      if (hash === "tos") {
        setActiveSection("tos");
      } else if (hash === "pp") {
        setActiveSection("pp");
      } else if (hash.startsWith("tos-")) {
        // Handle subsection hashes
        setActiveSection("tos");
        const element = document.getElementById(hash);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      } else if (hash.startsWith("pp-")) {
        // Handle subsection hashes
        setActiveSection("pp");
        const element = document.getElementById(hash);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      }
    }
  }, [location.hash]);

  const handleSectionClick = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    // Clear hash when switching main sections
    navigate(location.pathname, { replace: true });

    // Close mobile sidebar after selection
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSubSectionClick = (subsectionId: string) => {
    navigate(`${location.pathname}#${subsectionId}`, { replace: true });

    const element = document.getElementById(subsectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Close mobile sidebar after selection
    if (isMobile) {
      setOpenMobile(false);
    }
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
              EVTA Consult
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Legal</SidebarGroupLabel>
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
                        <div className="ml-6 mt-1 space-y-1 border-l border-neutral-200 pl-3 dark:border-neutral-800">
                          {subsections.map((subsection) => (
                            <button
                              key={subsection.id}
                              onClick={() =>
                                handleSubSectionClick(subsection.id)
                              }
                              className="block w-full py-1.5 text-left text-xs text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                            >
                              {subsection.title}
                            </button>
                          ))}
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
              Legal
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

interface ContentSectionProps {
  activeSection: SectionId;
}

function ContentSection({ activeSection }: ContentSectionProps) {
  const renderContent = () => {
    switch (activeSection) {
      case "tos":
        return (
          <div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="mb-8 text-sm text-neutral-600 dark:text-neutral-400">
              Last updated: December 16, 2025
            </p>

            <div className="prose prose-neutral max-w-none dark:prose-invert">
              <p className="text-neutral-700 dark:text-neutral-300">
                Welcome to EVTA Consult. By accessing and using our AI-powered
                consulting platform, you agree to be bound by these Terms of
                Service. Please read them carefully.
              </p>

              <SectionHeading id="tos-service-description">
                1. Service Description
              </SectionHeading>
              <p className="text-neutral-700 dark:text-neutral-300">
                EVTA Consult provides AI-powered business consulting services,
                including strategic planning, market analysis, and operational
                optimization. Our platform leverages advanced artificial
                intelligence to deliver personalized insights and
                recommendations tailored to your business needs.
              </p>

              <SectionHeading id="tos-user-obligations">
                2. User Obligations
              </SectionHeading>
              <p className="text-neutral-700 dark:text-neutral-300">
                You agree to provide accurate and complete information when
                using our services. You are responsible for maintaining the
                confidentiality of your account credentials and for all
                activities that occur under your account. You must notify us
                immediately of any unauthorized access or security breaches.
              </p>

              <SectionHeading id="tos-intellectual-property">
                3. Intellectual Property
              </SectionHeading>
              <p className="text-neutral-700 dark:text-neutral-300">
                All content, features, and functionality of the EVTA Consult
                platform, including but not limited to text, graphics, logos,
                and software, are owned by EVTA Consult and protected by
                international copyright, trademark, and other intellectual
                property laws.
              </p>

              <SectionHeading id="tos-limitation-liability">
                4. Limitation of Liability
              </SectionHeading>
              <p className="text-neutral-700 dark:text-neutral-300">
                EVTA Consult provides consulting recommendations based on AI
                analysis and should not be considered as professional financial,
                legal, or tax advice. While we strive for accuracy, we do not
                guarantee specific outcomes or results from implementing our
                recommendations.
              </p>

              <SectionHeading id="tos-termination">
                5. Termination
              </SectionHeading>
              <p className="text-neutral-700 dark:text-neutral-300">
                We reserve the right to terminate or suspend your access to our
                services at any time, without prior notice, for conduct that we
                believe violates these Terms of Service or is harmful to other
                users, us, or third parties, or for any other reason.
              </p>
            </div>
          </div>
        );

      case "pp":
        return (
          <div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="mb-8 text-sm text-neutral-600 dark:text-neutral-400">
              Last updated: December 16, 2025
            </p>

            <div className="prose prose-neutral max-w-none dark:prose-invert">
              <p className="text-neutral-700 dark:text-neutral-300">
                At EVTA Consult, we take your privacy seriously. This Privacy
                Policy explains how we collect, use, disclose, and safeguard
                your information when you use our AI consulting platform.
              </p>

              <SectionHeading id="pp-information-collect">
                1. Information We Collect
              </SectionHeading>
              <p className="text-neutral-700 dark:text-neutral-300">
                We collect information that you provide directly to us,
                including your name, email address, company information, and
                business data that you input for analysis. We also automatically
                collect certain information about your device and how you
                interact with our platform, such as IP address, browser type,
                and usage patterns.
              </p>

              <SectionHeading id="pp-use-information">
                2. How We Use Your Information
              </SectionHeading>
              <p className="text-neutral-700 dark:text-neutral-300">
                We use the information we collect to provide, maintain, and
                improve our services, including training and refining our AI
                models. We also use your information to communicate with you,
                respond to your inquiries, and send you technical notices and
                support messages.
              </p>

              <SectionHeading id="pp-data-security">
                3. Data Security
              </SectionHeading>
              <p className="text-neutral-700 dark:text-neutral-300">
                We implement industry-standard security measures to protect your
                personal information from unauthorized access, disclosure,
                alteration, and destruction. This includes encryption of data in
                transit and at rest, regular security audits, and strict access
                controls for our personnel.
              </p>

              <SectionHeading id="pp-information-sharing">
                4. Information Sharing
              </SectionHeading>
              <p className="text-neutral-700 dark:text-neutral-300">
                We do not sell, trade, or rent your personal information to
                third parties. We may share your information with trusted
                service providers who assist us in operating our platform,
                conducting our business, or serving our users, provided they
                agree to keep this information confidential.
              </p>

              <SectionHeading id="pp-your-rights">
                5. Your Rights
              </SectionHeading>
              <p className="text-neutral-700 dark:text-neutral-300">
                You have the right to access, update, or delete your personal
                information at any time. You may also opt out of receiving
                marketing communications from us. To exercise these rights,
                please contact us at privacy@evtaconsult.com.
              </p>

              <SectionHeading id="pp-changes-policy">
                6. Changes to This Policy
              </SectionHeading>
              <p className="text-neutral-700 dark:text-neutral-300">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last updated" date. You are advised
                to review this Privacy Policy periodically for any changes.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div>{renderContent()}</div>;
}
