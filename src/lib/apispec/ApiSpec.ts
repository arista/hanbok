export type TypeSpec =
  | StringTypeSpec
  | NumberTypeSpec
  | BooleanTypeSpec
  | NullTypeSpec
  | StringLiteralTypeSpec
  | NumberLiteralTypeSpec
  | BooleanLiteralTypeSpec
  | NullLiteralTypeSpec
  | ObjectTypeSpec
  | ArrayTypeSpec
  | EnumTypeSpec
  | TupleTypeSpec
  | UnionTypeSpec
  | IntersectionTypeSpec
  | RecordTypeSpec
  | OptionalTypeSpec

export type StringTypeSpec = {t: "string"}

export type NumberTypeSpec = {t: "number"}

export type BooleanTypeSpec = {t: "boolean"}

export type NullTypeSpec = {t: "null"}

export type StringLiteralTypeSpec = {t: "stringliteral", value: string}

export type NumberLiteralTypeSpec = {t: "numberliteral", value: number}

export type BooleanLiteralTypeSpec = {t: "booleanliteral", value: boolean}

export type NullLiteralTypeSpec = {t: "nullliteral", value: boolean}

export type ObjectTypeSpec = {t: "object", props: Record<string,TypeSpec>, extends?: ObjectTypeSpec }

export type ArrayTypeSpec = {t: "array", element: TypeSpec}

export type EnumTypeSpec = {t: "enum", values: Array<string>}

export type TupleTypeSpec = {t: "tuple", elements: Array<TypeSpec>}

export type UnionTypeSpec = {t: "or", types: Array<TypeSpec>}

export type IntersectionTypeSpec = {t: "and", types: Array<TypeSpec>}

export type RecordTypeSpec = {t: "record", key: TypeSpec, value: TypeSpec}

export type OptionalTypeSpec = {t: "optional", type: TypeSpec}
