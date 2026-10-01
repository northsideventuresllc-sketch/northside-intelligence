import "server-only";

export interface PastWinnerBenchmark {
  funder: string;
  grantProgram: string;
  winningQualities: string[];
  favoredTerminology: string[];
  commonMethodologies: string[];
  keyAdviceFromReviewers: string[];
}

/**
 * Compiles winning benchmark qualities from past funded grantees across federal, state, and foundation sources.
 */
export async function getPastWinnerBenchmark(
  funder: string,
  grantProgram: string
): Promise<PastWinnerBenchmark> {
  const normalized = funder.toLowerCase();
  const progNorm = grantProgram.toLowerCase();

  // 1. NEA / Arts & Humanities
  if (normalized.includes("nea") || normalized.includes("arts") || normalized.includes("culture") || progNorm.includes("art")) {
    return {
      funder,
      grantProgram,
      winningQualities: [
        "Deep community accessibility and direct public participation",
        "Clear artist compensation standards (W-2 / fair-wage contractor pay)",
        "Measurable artistic excellence coupled with cultural equity",
      ],
      favoredTerminology: [
        "Community resonance",
        "Public engagement",
        "Underserved access",
        "Artistic merit",
        "Civic vitality",
      ],
      commonMethodologies: [
        "Documented community feedback listening sessions",
        "Partnership with municipal cultural agencies or local community spaces",
        "Free or sliding-scale public programming",
      ],
      keyAdviceFromReviewers: [
        "Show exactly how artists are paid and demonstrate clear physical or digital accessibility for underserved audiences.",
      ],
    };
  }

  // 2. NSF / Science & Engineering / SBIR / STTR
  if (normalized.includes("nsf") || normalized.includes("science") || progNorm.includes("sbir") || progNorm.includes("sttr")) {
    return {
      funder,
      grantProgram,
      winningQualities: [
        "Rigorous technical de-risking milestones with clear falsifiable hypotheses",
        "Clear commercialization potential and scalable market size",
        "Strong Principal Investigator (PI) pedigree and subject matter mastery",
      ],
      favoredTerminology: [
        "Technical de-risking",
        "Novel intellectual property",
        "Commercial viability",
        "Scalable architecture",
        "Quantitative benchmarks",
      ],
      commonMethodologies: [
        "Iterative sprint-based prototyping with strict milestone deliverables",
        "Third-party laboratory validation and peer-reviewed testing",
        "Customer discovery interviews confirming market demand",
      ],
      keyAdviceFromReviewers: [
        "Distinguish between pure development and genuine technological research—NSF does not fund simple software app builds without R&D risk.",
      ],
    };
  }

  // 3. NIH / Health & Human Services (HHS)
  if (normalized.includes("nih") || normalized.includes("health") || normalized.includes("hhs") || normalized.includes("cdc")) {
    return {
      funder,
      grantProgram,
      winningQualities: [
        "Clinically grounded premise with demonstrable patient or public health impact",
        "Statistical rigor with predetermined power calculations and control cohorts",
        "Ethical compliance and robust data privacy safeguards",
      ],
      favoredTerminology: [
        "Translational research",
        "Public health efficacy",
        "Biostatistical rigor",
        "Patient-centered outcomes",
        "Epidemiological significance",
      ],
      commonMethodologies: [
        "Controlled trial or longitudinal cohort observational framework",
        "IRB-reviewed ethical protocols with diverse demographic enrollment",
        "Standardized bio-statistical and reproducibility validation",
      ],
      keyAdviceFromReviewers: [
        "Emphasize clinical translatability—reviewers reject proposals that lack a clear pipeline to measurable patient or community wellness impact.",
      ],
    };
  }

  // 4. Department of Energy (DOE) / Environmental / Climate
  if (normalized.includes("energy") || normalized.includes("doe") || normalized.includes("climate") || normalized.includes("epa")) {
    return {
      funder,
      grantProgram,
      winningQualities: [
        "Quantified greenhouse gas (GHG) or energy efficiency reduction metrics",
        "Techno-economic analysis (TEA) and life-cycle greenhouse gas assessment (LCA)",
        "Domestic manufacturing or regional economic transition impact",
      ],
      favoredTerminology: [
        "Levelized cost reduction",
        "Techno-economic viability",
        "Emissions abatement",
        "Grid resiliency",
        "Clean energy transition",
      ],
      commonMethodologies: [
        "Pilot-scale field deployment with continuous telemetry logging",
        "Life-cycle emissions analysis verified by third-party engineering audits",
        "Community benefits plan ensuring disadvantaged community investments",
      ],
      keyAdviceFromReviewers: [
        "Your Techno-Economic Analysis (TEA) must prove cost parity with incumbent fossil solutions under realistic commercial operating conditions.",
      ],
    };
  }

  // 5. Department of Education (ED) / Youth & Academic
  if (normalized.includes("education") || normalized.includes("school") || normalized.includes("academic") || normalized.includes("youth")) {
    return {
      funder,
      grantProgram,
      winningQualities: [
        "Evidence-based pedagogical framework backed by learning outcome assessments",
        "Commitment to closing achievement and opportunity gaps",
        "High educator retention and sustainable school district integration",
      ],
      favoredTerminology: [
        "Evidence-based pedagogy",
        "Opportunity gap closure",
        "Student achievement metrics",
        "Curricular fidelity",
        "Longitudinal learning gains",
      ],
      commonMethodologies: [
        "Pre- and post-intervention standardized learning assessments",
        "Co-design with local public school educators and parent councils",
        "Tiered professional development and classroom mentoring",
      ],
      keyAdviceFromReviewers: [
        "Show strong district buy-in with signed letters of commitment, not merely passive letters of support.",
      ],
    };
  }

  // 6. Universal Benchmark: Foundations, Philanthropic Endowments & Corporate Giving
  return {
    funder,
    grantProgram,
    winningQualities: [
      "Explicit, measurable key performance indicators (KPIs)",
      "Financial transparency with clear cost-per-beneficiary metrics",
      "Demonstrated long-term sustainability beyond the grant funding cycle",
    ],
    favoredTerminology: [
      "Measurable community impact",
      "Evidence-based methodology",
      "Sustainable outcomes",
      "Cost efficiency",
      "Stakeholder alignment",
    ],
    commonMethodologies: [
      "Logic model linking inputs, activities, outputs, and outcomes",
      "Quarterly milestone tracking with public impact reporting",
      "Cross-sector partnerships maximizing shared resources",
    ],
    keyAdviceFromReviewers: [
      "Avoid buzzwords and inflated projections; present modest, achievable targets with rigorous tracking methods.",
    ],
  };
}
