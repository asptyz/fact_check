```mermaid

flowchart TD
    A[YouTube Page] --> B[Content Script]
    B --> C1[Audio Capture Module]
    B --> C2[Video Frame Capture Module]
    C1 --> D1[Speech-to-Text Processor]
    C2 --> D2[Frame Processor]
    D1 --> E[Claim Extraction]
    D2 --> E
    E --> F[Gemini Flash 2.0 API]
    F --> G[Fact Verification]
    G --> H[Result Formatter]
    H --> I[UI Overlay]
    I --> J[User View]
    
  
