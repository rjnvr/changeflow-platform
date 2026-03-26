import {
  ChangeOrderStatus,
  IntegrationStatus,
  PrismaClient,
  ProjectStatus,
  UserRole
} from "@prisma/client";

import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();
const projectTeamMemberClient = (prisma as PrismaClient & {
  projectTeamMember: {
    deleteMany(): Promise<unknown>;
    createMany(args: unknown): Promise<unknown>;
  };
}).projectTeamMember;
const userClient = (prisma as PrismaClient & {
  user: {
    deleteMany(): Promise<unknown>;
    createMany(args: unknown): Promise<unknown>;
  };
}).user;
const projectDocumentClient = (prisma as PrismaClient & {
  projectDocument: {
    deleteMany(): Promise<unknown>;
    createMany(args: unknown): Promise<unknown>;
  };
}).projectDocument;
const changeOrderAttachmentClient = (prisma as PrismaClient & {
  changeOrderAttachment: {
    deleteMany(): Promise<unknown>;
    createMany(args: unknown): Promise<unknown>;
  };
}).changeOrderAttachment;
const changeOrderClient = (prisma as PrismaClient & {
  changeOrder: {
    deleteMany(): Promise<unknown>;
    createMany(args: unknown): Promise<unknown>;
  };
}).changeOrder;
const projectBriefGenerationClient = (prisma as PrismaClient & {
  projectBriefGeneration: {
    deleteMany(): Promise<unknown>;
    createMany(args: unknown): Promise<unknown>;
  };
}).projectBriefGeneration;

const now = new Date("2026-03-23T12:00:00.000Z");

const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

async function main() {
  await projectBriefGenerationClient.deleteMany();
  await prisma.auditLog.deleteMany();
  await changeOrderAttachmentClient.deleteMany();
  await prisma.changeOrder.deleteMany();
  await projectDocumentClient.deleteMany();
  await projectTeamMemberClient.deleteMany();
  await prisma.integrationConnection.deleteMany();
  await prisma.project.deleteMany();
  await userClient.deleteMany();

  await userClient.createMany({
    data: [
      {
        id: "usr_demo_1",
        email: "demo@changeflow.dev",
        firstName: "Demo",
        lastName: "User",
        passwordHash: hashPassword("password123"),
        role: UserRole.admin,
        dailyProjectBriefLimit: 3
      },
      {
        id: "usr_pm_1",
        email: "sarah.mitchell@changeflow.dev",
        firstName: "Sarah",
        lastName: "Mitchell",
        passwordHash: hashPassword("password123"),
        role: UserRole.project_manager,
        dailyProjectBriefLimit: 3
      },
      {
        id: "usr_acc_1",
        email: "marcus.chen@changeflow.dev",
        firstName: "Marcus",
        lastName: "Chen",
        passwordHash: hashPassword("password123"),
        role: UserRole.accounting,
        dailyProjectBriefLimit: 3
      }
    ]
  });

  await prisma.project.createMany({
    data: [
      {
        id: "prj_h26_001",
        name: "Harbor 26 Tower",
        code: "H26-TOWER",
        location: "Toronto, ON",
        status: ProjectStatus.active,
        contractValue: 4750000,
        ownerId: "usr_demo_1",
        createdAt: daysAgo(120),
        updatedAt: hoursAgo(3)
      },
      {
        id: "prj_sky_001",
        name: "Skyline Residences",
        code: "CF-SR-2024",
        location: "Vancouver, BC",
        status: ProjectStatus.active,
        contractValue: 20000000,
        ownerId: "usr_pm_1",
        createdAt: daysAgo(150),
        updatedAt: hoursAgo(2)
      },
      {
        id: "prj_hub_002",
        name: "Harbor Logistics Hub",
        code: "HLH-002",
        location: "Savannah, GA",
        status: ProjectStatus.active,
        contractValue: 54000000,
        ownerId: "usr_pm_1",
        createdAt: daysAgo(160),
        updatedAt: hoursAgo(6)
      },
      {
        id: "prj_phx_003",
        name: "Phoenix Tech Plaza",
        code: "PTP-003",
        location: "Phoenix, AZ",
        status: ProjectStatus.on_hold,
        contractValue: 9800000,
        ownerId: "usr_demo_1",
        createdAt: daysAgo(90),
        updatedAt: daysAgo(2)
      },
      {
        id: "prj_oak_004",
        name: "Oak Creek Bridge",
        code: "OCB-004",
        location: "Denver, CO",
        status: ProjectStatus.active,
        contractValue: 12400000,
        ownerId: "usr_pm_1",
        createdAt: daysAgo(220),
        updatedAt: hoursAgo(18)
      },
      {
        id: "prj_nsl_005",
        name: "Northside Library Renovation",
        code: "NLR-005",
        location: "Portland, OR",
        status: ProjectStatus.active,
        contractValue: 2850000,
        ownerId: "usr_demo_1",
        createdAt: daysAgo(74),
        updatedAt: daysAgo(1)
      },
      {
        id: "prj_emd_006",
        name: "Emerald Tower B",
        code: "ETB-006",
        location: "Seattle, WA",
        status: ProjectStatus.active,
        contractValue: 45000000,
        ownerId: "usr_pm_1",
        createdAt: daysAgo(201),
        updatedAt: hoursAgo(8)
      },
      {
        id: "prj_riv_007",
        name: "River Crossing",
        code: "RCR-007",
        location: "Nashville, TN",
        status: ProjectStatus.active,
        contractValue: 11350000,
        ownerId: "usr_acc_1",
        createdAt: daysAgo(118),
        updatedAt: hoursAgo(10)
      },
      {
        id: "prj_grn_008",
        name: "Greenwood Data Center",
        code: "GDC-008",
        location: "Columbus, OH",
        status: ProjectStatus.active,
        contractValue: 67200000,
        ownerId: "usr_acc_1",
        createdAt: daysAgo(140),
        updatedAt: hoursAgo(13)
      },
      {
        id: "prj_med_009",
        name: "Summit Medical Pavilion",
        code: "SMP-009",
        location: "Calgary, AB",
        status: ProjectStatus.active,
        contractValue: 18600000,
        ownerId: "usr_demo_1",
        createdAt: daysAgo(132),
        updatedAt: hoursAgo(22)
      },
      {
        id: "prj_trn_010",
        name: "Lakeshore Transit Terminal",
        code: "LTT-010",
        location: "Chicago, IL",
        status: ProjectStatus.active,
        contractValue: 31400000,
        ownerId: "usr_pm_1",
        createdAt: daysAgo(244),
        updatedAt: daysAgo(3)
      },
      {
        id: "prj_ccm_011",
        name: "Crescent Commons",
        code: "CCM-011",
        location: "Austin, TX",
        status: ProjectStatus.completed,
        contractValue: 9200000,
        ownerId: "usr_demo_1",
        createdAt: daysAgo(360),
        updatedAt: daysAgo(12)
      },
      {
        id: "prj_awp_012",
        name: "Aurora Water Plant",
        code: "AWP-012",
        location: "Aurora, CO",
        status: ProjectStatus.active,
        contractValue: 25800000,
        ownerId: "usr_acc_1",
        createdAt: daysAgo(305),
        updatedAt: daysAgo(4)
      },
      {
        id: "prj_dea_013",
        name: "District Energy Annex",
        code: "DEA-013",
        location: "Montreal, QC",
        status: ProjectStatus.on_hold,
        contractValue: 14100000,
        ownerId: "usr_pm_1",
        createdAt: daysAgo(177),
        updatedAt: daysAgo(9)
      }
    ]
  });

  await projectTeamMemberClient.createMany({
    data: [
      {
        id: "ptm_sky_001",
        projectId: "prj_sky_001",
        name: "James Sterling",
        role: "Site Lead",
        createdAt: daysAgo(21),
        updatedAt: daysAgo(2)
      },
      {
        id: "ptm_sky_002",
        projectId: "prj_sky_001",
        name: "Anita Wong",
        role: "Architecture",
        createdAt: daysAgo(20),
        updatedAt: daysAgo(2)
      },
      {
        id: "ptm_sky_003",
        projectId: "prj_sky_001",
        name: "Marcus Thorne",
        role: "Foreman",
        createdAt: daysAgo(18),
        updatedAt: daysAgo(1)
      },
      {
        id: "ptm_h26_001",
        projectId: "prj_h26_001",
        name: "Elena Park",
        role: "Commercial Lead",
        createdAt: daysAgo(16),
        updatedAt: daysAgo(3)
      },
      {
        id: "ptm_h26_002",
        projectId: "prj_h26_001",
        name: "Victor Ramirez",
        role: "Superintendent",
        createdAt: daysAgo(16),
        updatedAt: daysAgo(2)
      },
      {
        id: "ptm_hub_001",
        projectId: "prj_hub_002",
        name: "Rachel Stone",
        role: "Project Executive",
        createdAt: daysAgo(15),
        updatedAt: daysAgo(1)
      }
    ]
  });

  await projectDocumentClient.createMany({
    data: [
      {
        id: "doc_sky_001",
        projectId: "prj_sky_001",
        title: "Structural_V4.pdf",
        kind: "PDF",
        summary: "Updated structural package reflecting seismic reinforcement notes for Levels 4 through 8.",
        url: "https://example.com/docs/structural-v4.pdf",
        createdAt: daysAgo(4),
        updatedAt: hoursAgo(2)
      },
      {
        id: "doc_sky_002",
        projectId: "prj_sky_001",
        title: "Site_Layout_Final.dwg",
        kind: "Drawing",
        summary: "Latest coordinated drawing set for podium access, tower crane swing, and loading routes.",
        url: "https://example.com/docs/site-layout-final.dwg",
        createdAt: daysAgo(6),
        updatedAt: daysAgo(1)
      },
      {
        id: "doc_h26_001",
        projectId: "prj_h26_001",
        title: "Harbor26_Trade_Quote.xlsx",
        kind: "Quote",
        summary: "Consolidated subcontractor pricing workbook for lobby finishes and electrical relocation.",
        url: "https://example.com/docs/harbor26-trade-quote.xlsx",
        createdAt: daysAgo(8),
        updatedAt: hoursAgo(6)
      },
      {
        id: "doc_hub_001",
        projectId: "prj_hub_002",
        title: "Logistics_Concrete_Rework_Report.pdf",
        kind: "Report",
        summary: "Variance review covering slab rework, material disposal, and port scheduling impacts.",
        url: "https://example.com/docs/logistics-concrete-rework-report.pdf",
        createdAt: daysAgo(3),
        updatedAt: hoursAgo(10)
      },
      {
        id: "doc_oak_001",
        projectId: "prj_oak_004",
        title: "Bridge_Pier_Photoset.zip",
        kind: "Photo Set",
        summary: "Inspection imagery package documenting pier reinforcement progress and anchor-bolt checks.",
        url: "https://example.com/docs/bridge-pier-photoset.zip",
        createdAt: daysAgo(5),
        updatedAt: daysAgo(2)
      }
    ]
  });

  await projectBriefGenerationClient.createMany({
    data: [
      {
        id: "pbg_001",
        userId: "usr_demo_1",
        projectId: "prj_h26_001",
        createdAt: daysAgo(2)
      },
      {
        id: "pbg_002",
        userId: "usr_demo_1",
        projectId: "prj_sky_001",
        createdAt: daysAgo(1)
      },
      {
        id: "pbg_003",
        userId: "usr_pm_1",
        projectId: "prj_sky_001",
        createdAt: hoursAgo(30)
      },
      {
        id: "pbg_004",
        userId: "usr_pm_1",
        projectId: "prj_hub_002",
        createdAt: hoursAgo(26)
      },
      {
        id: "pbg_005",
        userId: "usr_pm_1",
        projectId: "prj_oak_004",
        createdAt: hoursAgo(12)
      },
      {
        id: "pbg_006",
        userId: "usr_acc_1",
        projectId: "prj_grn_008",
        createdAt: hoursAgo(20)
      }
    ]
  });

  await changeOrderClient.createMany({
    data: [
      {
        id: "co_1001",
        projectId: "prj_h26_001",
        title: "Lobby finish upgrade",
        description: "Upgrade lobby stone finish to owner-requested premium option.",
        status: ChangeOrderStatus.pending_review,
        amount: 28500,
        requestedBy: "Demo User",
        assignedTo: "Victor Ramirez",
        externalReference: "PROCORE-4832",
        aiSummary: "Owner requested a premium finish upgrade that increases material costs and schedule coordination.",
        createdAt: daysAgo(6),
        updatedAt: hoursAgo(4)
      },
      {
        id: "co_1024",
        projectId: "prj_sky_001",
        title: "Structural Steel Reinforcement",
        description: "Adjustments to Level 4 seismic bracing after structural review.",
        status: ChangeOrderStatus.approved,
        amount: 45000,
        requestedBy: "Sarah Mitchell",
        assignedTo: "James Sterling",
        externalReference: "SAGE-1024",
        aiSummary: "Structural reinforcement package was approved after seismic compliance review.",
        createdAt: daysAgo(10),
        updatedAt: hoursAgo(5)
      },
      {
        id: "co_1025",
        projectId: "prj_sky_001",
        title: "HVAC Ducting Realignment",
        description: "Rerouting through technical shaft B to resolve clash conditions.",
        status: ChangeOrderStatus.pending_review,
        amount: 12400,
        requestedBy: "Sarah Mitchell",
        assignedTo: "Anita Wong",
        externalReference: "PROCORE-9924",
        aiSummary: "Mechanical routing conflict requires review before schedule float is impacted.",
        createdAt: daysAgo(3),
        updatedAt: hoursAgo(2)
      },
      {
        id: "co_1028",
        projectId: "prj_h26_001",
        title: "Electrical Vault Relocation",
        description: "Sub-basement electrical vault relocated to support revised structural layout.",
        status: ChangeOrderStatus.synced,
        amount: 108500,
        requestedBy: "Marcus Chen",
        assignedTo: "Elena Park",
        externalReference: "INTACCT-1028",
        aiSummary: "Large-value electrical relocation already synced to accounting and external controls.",
        createdAt: daysAgo(12),
        updatedAt: hoursAgo(12)
      },
      {
        id: "co_1029",
        projectId: "prj_oak_004",
        title: "Landscape Grading Change",
        description: "Adjust final drainage swale elevations around the east approach.",
        status: ChangeOrderStatus.approved,
        amount: 8900,
        requestedBy: "Marcus Chen",
        assignedTo: "Field Coordination",
        externalReference: "PROCORE-9931",
        aiSummary: "Minor grading revision approved to improve drainage performance near the bridge approach.",
        createdAt: daysAgo(8),
        updatedAt: hoursAgo(14)
      },
      {
        id: "co_0442",
        projectId: "prj_sky_001",
        title: "HVAC Spec Adjustment",
        description: "Specification update requested after coordination with city energy standards.",
        status: ChangeOrderStatus.pending_review,
        amount: 12500,
        requestedBy: "City Inspector",
        assignedTo: "James Sterling",
        externalReference: "CO-442",
        aiSummary: "Pending specification change requires cross-discipline approval before field execution.",
        createdAt: daysAgo(1),
        updatedAt: hoursAgo(1)
      },
      {
        id: "co_0439",
        projectId: "prj_sky_001",
        title: "Lobby Stone Upgrade",
        description: "Upgrade selected lobby stone to the premium imported finish package.",
        status: ChangeOrderStatus.approved,
        amount: 48000,
        requestedBy: "Owner Rep",
        assignedTo: "Elena Park",
        externalReference: "CO-439",
        aiSummary: "Premium finish upgrade approved to match revised owner expectations for the public lobby.",
        createdAt: daysAgo(16),
        updatedAt: daysAgo(1)
      },
      {
        id: "co_0435",
        projectId: "prj_sky_001",
        title: "Glazing Reroute",
        description: "Adjust glazing package routing and staging due to site crane path constraints.",
        status: ChangeOrderStatus.approved,
        amount: 2100,
        requestedBy: "Site Superintendent",
        assignedTo: "Marcus Thorne",
        externalReference: "CO-435",
        aiSummary: "Low-impact glazing adjustment approved with no material schedule slip expected.",
        createdAt: daysAgo(18),
        updatedAt: daysAgo(2)
      },
      {
        id: "co_8842",
        projectId: "prj_riv_007",
        title: "Mechanical Coordination",
        description: "Revise coordination drawings to align duct risers with the updated shaft dimensions.",
        status: ChangeOrderStatus.approved,
        amount: 12850,
        requestedBy: "Modern HVAC",
        assignedTo: "Rachel Stone",
        externalReference: "REV-1.2",
        aiSummary: "Mechanical coordination package approved after updated shaft dimensions were issued.",
        createdAt: daysAgo(9),
        updatedAt: daysAgo(1)
      },
      {
        id: "co_9945",
        projectId: "prj_hub_002",
        title: "Foundation Overrun",
        description: "Unexpected soil stabilization and footing redesign increased the structural package cost.",
        status: ChangeOrderStatus.rejected,
        amount: 124000,
        requestedBy: "Elite Concrete",
        assignedTo: "Executive Review Board",
        externalReference: "REV-0.1",
        aiSummary: "High-value overrun requires dispute resolution due to estimate variance beyond approved thresholds.",
        createdAt: daysAgo(5),
        updatedAt: hoursAgo(7)
      },
      {
        id: "co_1002",
        projectId: "prj_phx_003",
        title: "Site Drainage Adjustment",
        description: "Initial setup phase drainage adjustment to accommodate revised utility trench routing.",
        status: ChangeOrderStatus.draft,
        amount: 8210,
        requestedBy: "Demo User",
        assignedTo: "Victor Ramirez",
        externalReference: "REV-2.3",
        aiSummary: "Draft drainage adjustment prepared for internal review before vendor release.",
        createdAt: daysAgo(2),
        updatedAt: hoursAgo(18)
      },
      {
        id: "co_1201",
        projectId: "prj_grn_008",
        title: "Crane Lift Revision",
        description: "Revise tower crane lift sequencing to support the prefabricated data hall modules.",
        status: ChangeOrderStatus.pending_review,
        amount: 62500,
        requestedBy: "Field Ops",
        assignedTo: "Commercial Controls",
        externalReference: "GDC-1201",
        aiSummary: "Lift sequence revision carries schedule risk and is awaiting executive approval.",
        createdAt: daysAgo(4),
        updatedAt: hoursAgo(9)
      },
      {
        id: "co_1304",
        projectId: "prj_emd_006",
        title: "Facade Anchor Revision",
        description: "Update facade anchor package after engineer of record issued revised loading criteria.",
        status: ChangeOrderStatus.synced,
        amount: 35200,
        requestedBy: "Facade Consultant",
        assignedTo: "Rachel Stone",
        externalReference: "ETB-1304",
        aiSummary: "Facade anchor revision synced after structural loading updates were approved.",
        createdAt: daysAgo(11),
        updatedAt: hoursAgo(20)
      },
      {
        id: "co_1408",
        projectId: "prj_med_009",
        title: "Generator Pad Rework",
        description: "Rework pad geometry to align with revised hospital backup generator installation tolerances.",
        status: ChangeOrderStatus.approved,
        amount: 18750,
        requestedBy: "Electrical PM",
        assignedTo: "Elena Park",
        externalReference: "SMP-1408",
        aiSummary: "Generator pad revision approved to avoid equipment fit-up issues during install.",
        createdAt: daysAgo(7),
        updatedAt: hoursAgo(11)
      }
    ]
  });

  await changeOrderAttachmentClient.createMany({
    data: [
      {
        id: "coa_1024_001",
        changeOrderId: "co_1024",
        title: "Steel framing revision package",
        storageKey: "seed/change-orders/co_1024/steel-framing-revision.pdf",
        fileName: "steel-framing-revision.pdf",
        contentType: "application/pdf",
        fileSize: 1843200,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(5)
      },
      {
        id: "coa_1024_002",
        changeOrderId: "co_1024",
        title: "Inspector markup photo",
        storageKey: "seed/change-orders/co_1024/inspector-markup.jpg",
        fileName: "inspector-markup.jpg",
        contentType: "image/jpeg",
        fileSize: 642800,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(4)
      },
      {
        id: "coa_1001_001",
        changeOrderId: "co_1001",
        title: "Lobby finish supplier quote",
        storageKey: "seed/change-orders/co_1001/lobby-finish-quote.pdf",
        fileName: "lobby-finish-quote.pdf",
        contentType: "application/pdf",
        fileSize: 903200,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(6)
      }
    ]
  });

  await prisma.integrationConnection.createMany({
    data: [
      {
        id: "int_1",
        provider: "Sage Intacct",
        status: IntegrationStatus.connected,
        lastSyncedAt: hoursAgo(0.1),
        createdAt: daysAgo(30),
        updatedAt: hoursAgo(0.1)
      },
      {
        id: "int_2",
        provider: "Procore",
        status: IntegrationStatus.connected,
        lastSyncedAt: hoursAgo(0.2),
        createdAt: daysAgo(30),
        updatedAt: hoursAgo(0.2)
      },
      {
        id: "int_3",
        provider: "Oracle NetSuite",
        status: IntegrationStatus.error,
        lastSyncedAt: daysAgo(1),
        createdAt: daysAgo(30),
        updatedAt: hoursAgo(3)
      },
      {
        id: "int_4",
        provider: "Master Gateway",
        status: IntegrationStatus.connected,
        lastSyncedAt: hoursAgo(0.05),
        createdAt: daysAgo(30),
        updatedAt: hoursAgo(0.05)
      },
      {
        id: "int_5",
        provider: "Webhooks v4",
        status: IntegrationStatus.connected,
        lastSyncedAt: hoursAgo(0.08),
        createdAt: daysAgo(30),
        updatedAt: hoursAgo(0.08)
      }
    ]
  });

  await prisma.auditLog.createMany({
    data: [
      {
        id: "audit_1",
        action: "integration.synced",
        entityType: "change_order",
        entityId: "co_1028",
        changeOrderId: "co_1028",
        metadata: { provider: "Sage Intacct", externalReference: "INTACCT-1028" },
        createdAt: hoursAgo(12)
      },
      {
        id: "audit_2",
        action: "change_order.status_updated",
        entityType: "change_order",
        entityId: "co_1025",
        changeOrderId: "co_1025",
        metadata: { status: "pending_review" },
        createdAt: hoursAgo(2)
      },
      {
        id: "audit_3",
        action: "project.created",
        entityType: "project",
        entityId: "prj_sky_001",
        metadata: { projectCode: "CF-SR-2024" },
        createdAt: daysAgo(150)
      }
    ]
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
