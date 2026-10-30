import SmoothScroll from "@/components/providers/SmoothScroll";

export default function RecruitmentLayout({ children }: LayoutProps<"/recruitment">) {
  return <SmoothScroll>{children}</SmoothScroll>;
}
