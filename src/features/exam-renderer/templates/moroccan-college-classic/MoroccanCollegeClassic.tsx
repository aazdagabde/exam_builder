import type { PropsWithChildren } from "react";

export const MOROCCAN_COLLEGE_CLASSIC_ID = "moroccan-college-classic";

export function MoroccanCollegeClassic({ children }: PropsWithChildren) {
  return (
    <div className="exam-template exam-template--moroccan-college-classic">
      {children}
    </div>
  );
}
