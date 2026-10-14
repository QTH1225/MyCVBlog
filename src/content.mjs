// 公开展示内容已匿名化。这里不保存真实姓名、联系方式或可识别的履历。
export const profile = {
  name: 'Anonymous',
  phone: '+86 1XX-XXXX-XXXX',
  email: 'hello@example.com',
  website: { label: 'example.com', url: 'https://example.com/' },
  github: { label: 'GitHub', url: 'https://github.com/' },
};

export const education = [
  {
    institution: 'University (name withheld)',
    location: 'Location withheld',
    degree: 'Structural Engineering',
    dates: '09 2025 - Present',
  },
  {
    institution: 'University (name withheld)',
    location: 'Location withheld',
    degree: 'Bachelor of Civil Engineering',
    dates: '09 2021 - 06 2025',
    courses: [
      ['Mechanics', 'Theoretical Mechanics, Mechanics of Materials, Structural Mechanics, Soil Mechanics'],
      ['Professional', 'Principle of Structural Design, Reinforced Concrete Structure, Steel and Composite Construction'],
    ],
  },
];

export const skills = [
  ['Programming Languages', 'Python, MATLAB, LaTeX'],
  ['Professional Interests', 'Engineering, simulation, and technical writing'],
];

// 演示内容，不代表真实项目。每项自动生成 /projects/<id>/index.html。
export const projects = [
  {
    id: 'conductive-concrete-example',
    title: 'Conductive Concrete Characterization',
    subtitle: 'Illustrative project · Concrete materials research',
    dates: '2022 - 2024',
    summary: [
      'Compared fluidity and electrical resistivity in fine-grained concrete containing carbon fiber and graphite.',
      'Examined compressive, flexural, and uniaxial behavior and explored a stress–strain constitutive model.',
    ],
    sections: [
      { heading: 'PROJECT OVERVIEW', paragraphs: ['This example draws on the conductive-concrete research described in the original résumé, without identifying an institution, grant, or project team.'] },
      { heading: 'EXPERIMENTAL WORK', bullets: ['Measure fluidity with individual and combined additions of carbon fiber and graphite.', 'Use the four-electrode method to investigate electrical resistivity and conductive paths.', 'Compare compressive, flexural, and uniaxial compression responses.'] },
      { heading: 'MODELING', paragraphs: ['The résumé also describes proposing a uniaxial stress–strain constitutive model. This example reserves space for a model explanation, test figures, and supporting notes.'] },
    ],
  },
  {
    id: 'knowledge-base-demo',
    title: 'Personal Knowledge Base',
    subtitle: 'Demo project',
    dates: '',
    summary: [
      'A résumé-style website for organizing project pages and Markdown notes.',
      'Notes support local images, mathematical notation, code blocks, and tables.',
    ],
    sections: [
      {
        heading: 'PROJECT OVERVIEW',
        paragraphs: ['This demonstration shows how a project page shares the résumé layout while presenting its own content. Personal project details have been withheld.'],
      },
      {
        heading: 'NOTES',
        paragraphs: ['Use the Notes section to read Markdown notes containing images, inline formulas, display equations, tables, and code examples.'],
      },
    ],
  },
];

// 原简历未提供真实任职经历，以下为依照其研究方向编写的版式示例。
export const workExperience = [
  {
    id: 'materials-research-example',
    title: 'Materials Testing and Research Support',
    subtitle: 'Illustrative experience · Materials laboratory',
    dates: '2022 - 2024 (example)',
    summary: ['Example responsibilities: prepare concrete mixtures and organize fluidity, resistivity, and strength tests.', 'Record observations, compare material formulations, and summarize experimental results.'],
    sections: [
      { heading: 'ROLE OVERVIEW', paragraphs: ['This illustrative laboratory experience is based on the concrete-materials topics in the original résumé. It does not represent a verified employment appointment.'] },
      { heading: 'EXAMPLE RESPONSIBILITIES', bullets: ['Prepare specimen and test records for carbon-fiber and graphite mixtures.', 'Organize fluidity, four-electrode resistivity, and mechanical-test measurements.', 'Prepare tables, plots, and written summaries for research discussions.'] },
    ],
  },
  {
    id: 'structural-simulation-example',
    title: 'Structural Simulation and Technical Documentation',
    subtitle: 'Illustrative experience · Engineering team',
    dates: '2024 (example)',
    summary: ['Example responsibilities: develop structural simulation cases using ABAQUS or COMSOL and document their assumptions.', 'Use Python or MATLAB to organize outputs and prepare technical notes in LaTeX.'],
    sections: [
      { heading: 'ROLE OVERVIEW', paragraphs: ['This illustrative experience uses the engineering and programming tools listed in the original résumé. The role, team, and dates are examples.'] },
      { heading: 'EXAMPLE RESPONSIBILITIES', bullets: ['Document geometry, material properties, loads, and boundary conditions.', 'Compare simulation outputs across clearly stated assumptions.', 'Organize analysis results and prepare readable technical documentation.'] },
    ],
  },
];
// 从原简历恢复奖项类型与日期；省略学校、赞助方与具体名次人数。
export const honors = [
  ['First-class Scholarship (Top 1%)', 'Nov. 2024'],
  ['University First-class Scholarship (Top 5%)', 'Nov. 2024'],
  ['First-class Scholarship (Top 2%)', 'Nov. 2023'],
  ['Second-class Scholarship (Top 15%)', 'Nov. 2022, 2023'],
];
export const awards = [
  ['Second Prize in Provincial Energy Conservation Competition', 'May 2024'],
  ['Honorable Mention in Mathematical Modeling Competition', 'Jan. 2024'],
  ['First Prize in Provincial Engineering Management Competition', 'Nov. 2023'],
  ['Silver Medal in University Physics Competition', 'Jan. 2023'],
  ['Second Prize in Mathematical Modeling Competition', 'Jan. 2023'],
];
// 独立编写的论文版式示例，不引用原简历论文；作者均为占位名称。
export const publications = [
  {
    id: 'structural-response-example',
    title: 'Example Paper: Predicting Structural Response with Surrogate Models',
    authors: [{ name: 'Author A', highlight: true }, { name: 'Author B' }, { name: 'Author C' }],
    journal: 'Example Journal of Structural Engineering',
    year: '2026',
  },
  {
    id: 'test-data-analysis-example',
    title: 'Example Paper: Reproducible Analysis of Laboratory Test Data',
    authors: [{ name: 'Author A', highlight: true }, { name: 'Author D' }],
    journal: 'Example Journal of Experimental Methods',
    year: '2025',
  },
];
