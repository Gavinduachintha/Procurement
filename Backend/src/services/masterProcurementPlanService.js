import { masterProcurementPlanRepository } from "../repositories/masterProcurementPlanRepository.js";
import { ApiError } from "../utils/apiError.js";
import { USER_ROLES } from "../utils/constants.js";

const PLAN_YEAR = 2026;

const DEPARTMENT_OPTIONS = [
  "Rehabilitation & Works",
  "Faculty of Applied Sciences",
  "Faculty of Agriculture & Plantation Management",
  "Faculty of Livestock Fisheries & Nutrition",
  "Faculty of Business Studies & Finance",
  "Faculty of Technology",
  "Faculty of Medicine",
  "Hostels",
  "Canteens",
  "Library",
  "Staff Development Centre",
  "Physical Education Unit",
  "ICT Centre / Kuliyapitiya",
  "ICT Centre / Makandura",
  "Administration Divisions",
  "Finance & Supplies Branch",
  "Medical Center",
  "Quality Assurance",
  "Entrepreneurship Skills Development (WUBIC)",
  "Leadership Development / CGU",
  "Strengthening Research (SRHDC)/Masters",
];

const PROCUREMENT_CATEGORY_OPTIONS = [
  "Works",
  "Goods",
  "Services",
  "Consultancy",
];
const SOURCE_OF_FINANCING_OPTIONS = [
  "GOSL",
  "ADB",
  "World Bank",
  "Own Revenue",
  "Other Donor",
];

const PROCUREMENT_METHOD_OPTIONS = [
  "ICB",
  "LIB",
  "LNB",
  "NCB",
  "NCB & National Shopping",
  "National Shopping",
  "Direct Contracting",
];

const LEVEL_OF_AUTHORITY_OPTIONS = [
  "HLPC",
  "SHLPC",
  "MPC",
  "DPC Minor",
  "DPC Major",
  "RPC",
];

const PRIORITY_STATUS_OPTIONS = ["P", "N", "U"];

const CURRENT_STATUS_OPTIONS = [
  "Planning for the year 2026",
  "Approval for Procurement Plan 2026",
  "Tender Documents Prepared",
  "Advertised",
  "Bids Evaluated",
  "Contract Awarded",
  "Implementation Ongoing",
  "Completed",
];

const normalizePayload = (payload = {}) => ({
  department: String(payload.department || "").trim(),
  subCategory: String(payload.subCategory || "").trim(),
  description: String(payload.description || "").trim(),
  procurementCategory: String(payload.procurementCategory || "").trim(),
  estimatedCostMn:
    payload.estimatedCostMn === "" ||
    payload.estimatedCostMn == null ||
    Number.isNaN(Number(payload.estimatedCostMn))
      ? null
      : Number(payload.estimatedCostMn),
  sourceOfFinancing: String(payload.sourceOfFinancing || "").trim(),
  donorFinancierName: String(payload.donorFinancierName || "").trim(),
  procurementMethod: String(payload.procurementMethod || "").trim(),
  levelOfAuthority: String(payload.levelOfAuthority || "").trim(),
  priorityStatus: String(payload.priorityStatus || "P").trim(),
  currentStatus: String(payload.currentStatus || "").trim(),
  commencementYr1: Boolean(payload.commencementYr1),
  commencementYr2: Boolean(payload.commencementYr2),
  commencementYr3: Boolean(payload.commencementYr3),
  completionYr1: Boolean(payload.completionYr1),
  completionYr2: Boolean(payload.completionYr2),
  completionYr3: Boolean(payload.completionYr3),
  contractPeriod: String(payload.contractPeriod || "").trim(),
  reference: String(payload.reference || "").trim(),
  remark: String(payload.remark || "").trim(),
});

const validateAllowedValues = (field, value, allowedValues) => {
  if (!allowedValues.includes(value)) {
    throw new ApiError(400, `${field} has an invalid value`);
  }
};

const validateForSubmit = (payload) => {
  if (!payload.department) {
    throw new ApiError(400, "Department is required");
  }

  if (!payload.description || !payload.description.trim()) {
    throw new ApiError(400, "Description is required");
  }

  if (
    !Number.isFinite(payload.estimatedCostMn) ||
    payload.estimatedCostMn <= 0
  ) {
    throw new ApiError(400, "Estimated cost must be greater than zero");
  }

  if (!payload.procurementCategory) {
    throw new ApiError(400, "Procurement category is required");
  }

  if (!payload.sourceOfFinancing) {
    throw new ApiError(400, "Source of financing is required");
  }

  if (!payload.procurementMethod) {
    throw new ApiError(400, "Procurement method is required");
  }

  if (!payload.levelOfAuthority) {
    throw new ApiError(400, "Level of authority is required");
  }

  if (!payload.priorityStatus) {
    throw new ApiError(400, "Priority status is required");
  }

  if (!payload.currentStatus) {
    throw new ApiError(
      400,
      "Current procurement preparedness status is required",
    );
  }

  validateAllowedValues("Department", payload.department, DEPARTMENT_OPTIONS);
  validateAllowedValues(
    "Procurement category",
    payload.procurementCategory,
    PROCUREMENT_CATEGORY_OPTIONS,
  );
  validateAllowedValues(
    "Source of financing",
    payload.sourceOfFinancing,
    SOURCE_OF_FINANCING_OPTIONS,
  );
  validateAllowedValues(
    "Procurement method",
    payload.procurementMethod,
    PROCUREMENT_METHOD_OPTIONS,
  );
  validateAllowedValues(
    "Level of authority",
    payload.levelOfAuthority,
    LEVEL_OF_AUTHORITY_OPTIONS,
  );
  validateAllowedValues(
    "Priority status",
    payload.priorityStatus,
    PRIORITY_STATUS_OPTIONS,
  );
  validateAllowedValues(
    "Current status",
    payload.currentStatus,
    CURRENT_STATUS_OPTIONS,
  );

  if (
    payload.sourceOfFinancing === "Other Donor" &&
    !payload.donorFinancierName
  ) {
    throw new ApiError(
      400,
      "Donor/Financier name is required when source is Other Donor",
    );
  }
};

const enrichForPersistence = (payload, user, recordStatus) => {
  const departmentRank = DEPARTMENT_OPTIONS.indexOf(payload.department) + 1;
  const procurementCategoryRank =
    PROCUREMENT_CATEGORY_OPTIONS.indexOf(payload.procurementCategory) + 1;
  const procurementMethodRank =
    PROCUREMENT_METHOD_OPTIONS.indexOf(payload.procurementMethod) + 1;

  return {
    ...payload,
    planYear: PLAN_YEAR,
    createdBy: user.id,
    recordStatus,
    department: payload.department || null,
    subCategory: payload.subCategory || null,
    description: payload.description || null,
    procurementCategory: payload.procurementCategory || null,
    sourceOfFinancing: payload.sourceOfFinancing || null,
    donorFinancierName:
      payload.sourceOfFinancing === "GOSL"
        ? null
        : payload.donorFinancierName || null,
    procurementMethod: payload.procurementMethod || null,
    levelOfAuthority: payload.levelOfAuthority || null,
    priorityStatus: payload.priorityStatus || null,
    currentStatus: payload.currentStatus || null,
    contractPeriod: payload.contractPeriod || null,
    reference: payload.reference || null,
    remark: payload.remark || null,
    departmentRank: departmentRank > 0 ? departmentRank : 0,
    procurementCategoryRank:
      procurementCategoryRank > 0 ? procurementCategoryRank : 0,
    procurementMethodRank:
      procurementMethodRank > 0 ? procurementMethodRank : 0,
  };
};

export const masterProcurementPlanService = {
  async createOrDraft(user, rawPayload) {
    if (user.role !== USER_ROLES.SUPPLY_BRANCH) {
      throw new ApiError(
        403,
        "Only supply branch officers can create master procurement plans",
      );
    }

    const payload = normalizePayload(rawPayload);
    const isDraft = Boolean(rawPayload?.isDraft);

    if (!isDraft) {
      validateForSubmit(payload);
    }

    const normalizedForSave = enrichForPersistence(
      payload,
      user,
      isDraft ? "DRAFT" : "SUBMITTED",
    );

    return masterProcurementPlanRepository.createWithGeneratedItemCode(
      normalizedForSave,
    );
  },

  async listMine(user) {
    if (user.role !== USER_ROLES.SUPPLY_BRANCH) {
      throw new ApiError(
        403,
        "Only supply branch officers can view master procurement plans",
      );
    }

    return masterProcurementPlanRepository.listByCreator(user.id);
  },

  getFormMetadata() {
    return {
      planYear: PLAN_YEAR,
      options: {
        departments: DEPARTMENT_OPTIONS,
        procurementCategories: PROCUREMENT_CATEGORY_OPTIONS,
        sourceOfFinancing: SOURCE_OF_FINANCING_OPTIONS,
        procurementMethods: PROCUREMENT_METHOD_OPTIONS,
        levelsOfAuthority: LEVEL_OF_AUTHORITY_OPTIONS,
        priorityStatuses: PRIORITY_STATUS_OPTIONS,
        currentStatuses: CURRENT_STATUS_OPTIONS,
      },
    };
  },
};
