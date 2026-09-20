export type NodeType =
  | "person"
  | "place"
  | "invite"
  | "link"
  | "arc"
  | "org"
  | "product"
  | "usecase"
  | "skill"
  | "school"
  | "principle"
  | "note";

export type GroupId =
  | "core"
  | "arc"
  | "org"
  | "product"
  | "skill"
  | "school"
  | "principle"
  | "note";

export type ShapeKind =
  | "circle"
  | "ring"
  | "square"
  | "star"
  | "triangle"
  | "diamond"
  | "wye";

export interface TypeStyle {
  shape: ShapeKind;
  size: number;
  r: number;
  group: GroupId;
}

export interface GroupDef {
  label: string;
  kind: string;
  hiddenByDefaultOnPhones: boolean;
}

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  sub?: string;
  blurb: string;
  idx?: number;
  arc?: string;
  now?: boolean;
  url?: string;
  urlLabel?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  rel: string;
}

export interface SiteCopy {
  taglineBefore: string;
  taglineHighlight: string;
  taglineAfter: string;
  searchPlaceholder: string;
  sayHi: string;
  introKicker: string;
  introTitle: string;
  introBody: string[];
  introPhone: string[];
  hint: string;
  close: string;
  connections: string;
  now: string;
  claimSlot: string;
  visit: string;
  modalTitle: string;
  modalLead: string;
  reasonLabel: string;
  reasons: string[];
  nameLabel: string;
  namePlaceholder: string;
  noteLabel: string;
  notePlaceholder: string;
  send: string;
  modalClose: string;
  submitStatus: string;
}

export interface GraphData {
  copy: SiteCopy;
  types: Record<NodeType, TypeStyle>;
  groups: Record<GroupId, GroupDef>;
  nodes: GraphNode[];
  links: GraphLink[];
}

export const LEAF_TYPES: ReadonlySet<NodeType> = new Set([
  "skill",
  "usecase",
  "note",
  "place",
  "school",
  "principle",
  "link",
]);

export const CHIP_ORDER: GroupId[] = [
  "arc",
  "org",
  "product",
  "skill",
  "school",
  "principle",
  "note",
];
