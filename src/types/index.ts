export type MarksOption = 5 | 8 | 10;

export type UploadKind = "notes" | "questionBank" | "previousYearQuestions";

export interface GenerationRequest {
  marks: MarksOption;
  includeDiagrams: boolean;
  files: Partial<Record<UploadKind, string>>;
  fileUrls?: Partial<Record<UploadKind, string>>;
  // Original uploaded filenames (optional) so downstream services can name files
  fileNames?: Partial<Record<UploadKind, string>>;
}
