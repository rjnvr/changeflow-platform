import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  addChangeOrderComment,
  archiveChangeOrder,
  getChangeOrder,
  getChangeOrderActivity,
  getChangeOrderComments,
  updateChangeOrderStatus
} from "../api/changeOrders";
import { EditChangeOrderModal } from "../components/change-orders/EditChangeOrderModal";
import { WorkspaceFooter } from "../components/layout/WorkspaceFooter";
import { useAuthContext } from "../context/AuthContext";
import { useProjects } from "../hooks/useProjects";
import type { ChangeOrder, ChangeOrderActivityItem, ChangeOrderComment } from "../types/changeOrder";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatFileSize(fileSize: number) {
  if (fileSize >= 1024 * 1024) {
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
}

function statusCopy(status: ChangeOrder["status"]) {
  return {
    draft: { label: "Draft", backgroundColor: "#CFE6F2", color: "#3F4945" },
    pending_review: { label: "Pending Review", backgroundColor: "#FFDBD1", color: "#872000" },
    approved: { label: "Approved", backgroundColor: "#9DEFDE", color: "#0F6F62" },
    rejected: { label: "Rejected", backgroundColor: "#FFD8CF", color: "#7A1E08" },
    synced: { label: "Synced", backgroundColor: "#D5ECF8", color: "#046B5E" }
  }[status];
}

function activityLabel(activity: ChangeOrderActivityItem) {
  const labels: Record<string, string> = {
    "change_order.created": "Change order created",
    "change_order.status_updated": "Status updated",
    "change_order.comment_added": "Comment added",
    "change_order.imported": "Imported into pipeline"
  };

  return labels[activity.action] ?? activity.action.replaceAll("_", " ");
}

function activityDescription(activity: ChangeOrderActivityItem) {
  if (!activity.metadata) {
    return null;
  }

  if (activity.action === "change_order.status_updated" && typeof activity.metadata.status === "string") {
    return `Moved to ${statusCopy(activity.metadata.status as ChangeOrder["status"]).label.toLowerCase()}.`;
  }

  if (activity.action === "change_order.comment_added" && typeof activity.metadata.authorName === "string") {
    return `Added by ${activity.metadata.authorName}.`;
  }

  if (activity.action === "change_order.created" && typeof activity.metadata.assignedTo === "string") {
    return `Assigned to ${activity.metadata.assignedTo}.`;
  }

  return Object.entries(activity.metadata)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" • ");
}

export function ChangeOrderDetailsPage() {
  const navigate = useNavigate();
  const { changeOrderId = "" } = useParams();
  const { user } = useAuthContext();
  const { projects } = useProjects({ includeArchived: true });
  const [changeOrder, setChangeOrder] = useState<ChangeOrder | null>(null);
  const [comments, setComments] = useState<ChangeOrderComment[]>([]);
  const [activity, setActivity] = useState<ChangeOrderActivityItem[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<ChangeOrder["status"] | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);

  const project = useMemo(
    () => projects.find((entry) => entry.id === changeOrder?.projectId),
    [changeOrder?.projectId, projects]
  );

  async function refresh() {
    if (!changeOrderId) {
      setError("Change order not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [nextChangeOrder, nextComments, nextActivity] = await Promise.all([
        getChangeOrder(changeOrderId),
        getChangeOrderComments(changeOrderId),
        getChangeOrderActivity(changeOrderId)
      ]);

      setChangeOrder(nextChangeOrder);
      setComments(nextComments);
      setActivity(nextActivity);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load change order.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [changeOrderId]);

  async function handleStatusUpdate(status: ChangeOrder["status"]) {
    if (!changeOrder) {
      return;
    }

    setUpdatingStatus(status);
    setMessage("");
    setError("");

    try {
      const updatedChangeOrder = await updateChangeOrderStatus(changeOrder.id, { status });
      setChangeOrder(updatedChangeOrder);
      const nextActivity = await getChangeOrderActivity(changeOrder.id);
      setActivity(nextActivity);
      setMessage(`Change order moved to ${statusCopy(status).label.toLowerCase()}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update status.");
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleAddComment() {
    if (!changeOrder || !user) {
      return;
    }

    if (commentBody.trim().length < 2) {
      setError("Add a short comment before posting.");
      return;
    }

    setSubmittingComment(true);
    setMessage("");
    setError("");

    try {
      await addChangeOrderComment(changeOrder.id, {
        authorName: `${user.firstName} ${user.lastName}`,
        body: commentBody.trim()
      });
      setCommentBody("");
      const [nextComments, nextActivity] = await Promise.all([
        getChangeOrderComments(changeOrder.id),
        getChangeOrderActivity(changeOrder.id)
      ]);
      setComments(nextComments);
      setActivity(nextActivity);
      setMessage("Comment added to the review thread.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to add comment.");
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading) {
    return (
      <Stack spacing={3} alignItems="center" sx={{ py: 10 }}>
        <CircularProgress />
        <Typography sx={{ color: "#5A6A84" }}>Loading change order review workspace...</Typography>
      </Stack>
    );
  }

  if (!changeOrder) {
    return <Alert severity="warning">{error || "Change order not found."}</Alert>;
  }

  const statusMeta = statusCopy(changeOrder.status);
  const canEditChangeOrder = Boolean(user && project && (user.role === "admin" || user.id === project.ownerId));
  const canManageChangeOrder = canEditChangeOrder && !changeOrder.archivedAt && !project?.archivedAt;

  return (
    <Stack spacing={4}>
      {message ? <Alert severity="success">{message}</Alert> : null}
      {error ? <Alert severity="warning">{error}</Alert> : null}
      {changeOrder.archivedAt || project?.archivedAt ? (
        <Alert severity="warning">This change order is archived and read-only.</Alert>
      ) : null}

      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
        <Box sx={{ maxWidth: 820 }}>
          <Typography
            sx={{
              mb: 1,
              fontSize: "0.82rem",
              fontWeight: 800,
              letterSpacing: 2.2,
              textTransform: "uppercase",
              color: "#046B5E"
            }}
          >
            Review Workflow
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: { xs: "2.8rem", md: "4rem" },
              fontWeight: 900,
              letterSpacing: -2.4,
              lineHeight: 0.95,
              color: "#00342B"
            }}
          >
            {changeOrder.title}
          </Typography>
          <Stack direction="row" spacing={1.2} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
            <Box sx={{ px: 1.6, py: 0.75, borderRadius: 999, backgroundColor: statusMeta.backgroundColor, color: statusMeta.color }}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>
                {statusMeta.label}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "0.96rem", color: "#5A6A84" }}>
              {project?.name ?? changeOrder.projectId} • Updated {formatDate(changeOrder.updatedAt)}
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
          {canManageChangeOrder ? (
            <ButtonBase
              onClick={() => setEditModalOpen(true)}
              sx={{ px: 2, py: 1.2, borderRadius: 2.5, backgroundColor: "#E6F6FF", color: "#00342B" }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>Edit</Typography>
                <EditRoundedIcon sx={{ fontSize: 18 }} />
              </Stack>
            </ButtonBase>
          ) : null}
          {canManageChangeOrder ? (
            <ButtonBase
              onClick={async () => {
                const confirmed = window.confirm("Archive this change order? Archived items become read-only.");

                if (!confirmed) {
                  return;
                }

                setMessage("");
                setError("");

                try {
                  await archiveChangeOrder(changeOrder.id);
                  navigate("/app/resources?panel=archive");
                } catch (requestError) {
                  setError(requestError instanceof Error ? requestError.message : "Unable to archive change order.");
                }
              }}
              sx={{ px: 2, py: 1.2, borderRadius: 2.5, backgroundColor: "#FFF1EE", color: "#872000" }}
            >
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>Archive</Typography>
            </ButtonBase>
          ) : null}
          <ButtonBase
            onClick={() => navigate(`/app/projects/${changeOrder.projectId}`)}
            sx={{ px: 2, py: 1.2, borderRadius: 2.5, backgroundColor: "#D5ECF8", color: "#00342B" }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>Open Project</Typography>
              <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
            </Stack>
          </ButtonBase>
        </Stack>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "2fr 1fr" }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <Paper elevation={0} sx={{ p: 3.4, borderRadius: 4, backgroundColor: "#FFFFFF" }}>
            <Typography sx={{ fontSize: "1.45rem", fontWeight: 800, color: "#00342B" }}>Commercial Summary</Typography>
            <Typography sx={{ mt: 2, fontSize: "1rem", lineHeight: 1.7, color: "#42536D" }}>
              {changeOrder.aiSummary ?? changeOrder.description}
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, mt: 3.2 }}>
              {[
                { label: "Amount", value: formatCurrency(changeOrder.amount) },
                { label: "Requested By", value: changeOrder.requestedBy },
                { label: "Assigned To", value: changeOrder.assignedTo ?? "Unassigned" }
              ].map((item) => (
                <Box key={item.label} sx={{ p: 2.4, borderRadius: 3, backgroundColor: "#F3FAFF" }}>
                  <Typography sx={{ fontSize: "0.74rem", fontWeight: 800, letterSpacing: 1.8, textTransform: "uppercase", color: "#93A6C3" }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ mt: 1, fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>{item.value}</Typography>
                </Box>
              ))}
            </Box>

            <Typography sx={{ mt: 3.2, fontSize: "0.98rem", lineHeight: 1.65, color: "#42536D" }}>
              {changeOrder.description}
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ p: 3.4, borderRadius: 4, backgroundColor: "#FFFFFF" }}>
            <Typography sx={{ fontSize: "1.45rem", fontWeight: 800, color: "#00342B" }}>Attachments</Typography>
            <Stack spacing={1.4} sx={{ mt: 2.4 }}>
              {changeOrder.attachments.length > 0 ? (
                changeOrder.attachments.map((attachment) => (
                  <Box key={attachment.id} sx={{ p: 2.2, borderRadius: 3, backgroundColor: "#F3FAFF" }}>
                    <Typography sx={{ fontSize: "0.96rem", fontWeight: 800, color: "#00342B" }}>{attachment.fileName}</Typography>
                    <Typography sx={{ mt: 0.4, fontSize: "0.86rem", color: "#5A6A84" }}>
                      {attachment.contentType} • {formatFileSize(attachment.fileSize)}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography sx={{ fontSize: "0.96rem", color: "#5A6A84" }}>
                  No attachments have been added to this change order yet.
                </Typography>
              )}
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 3.4, borderRadius: 4, backgroundColor: "#FFFFFF" }}>
            <Typography sx={{ fontSize: "1.45rem", fontWeight: 800, color: "#00342B" }}>Review Thread</Typography>
            {!canManageChangeOrder ? (
              <Alert severity="info" sx={{ mt: 2.2 }}>
                Comments are locked once a change order is archived.
              </Alert>
            ) : (
              <>
                <TextField
                  multiline
                  minRows={3}
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  placeholder="Add approval notes, vendor follow-up, or review context..."
                  sx={{
                    mt: 2.2,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      backgroundColor: "#E6F6FF"
                    }
                  }}
                />
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.6 }}>
                  <ButtonBase
                    onClick={handleAddComment}
                    disabled={submittingComment}
                    sx={{
                      px: 2.2,
                      py: 1.2,
                      borderRadius: 2.5,
                      backgroundColor: "#00342B",
                      color: "#FFFFFF",
                      opacity: submittingComment ? 0.7 : 1
                    }}
                  >
                    <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>
                      {submittingComment ? "Posting..." : "Add Comment"}
                    </Typography>
                  </ButtonBase>
                </Stack>
              </>
            )}

            <Stack spacing={1.8} sx={{ mt: 2.4 }}>
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <Box key={comment.id} sx={{ p: 2.2, borderRadius: 3, backgroundColor: "#F8FBFF" }}>
                    <Stack direction="row" justifyContent="space-between" gap={2} flexWrap="wrap">
                      <Typography sx={{ fontSize: "0.94rem", fontWeight: 800, color: "#00342B" }}>{comment.authorName}</Typography>
                      <Typography sx={{ fontSize: "0.82rem", color: "#7A869F" }}>{formatDateTime(comment.createdAt)}</Typography>
                    </Stack>
                    <Typography sx={{ mt: 1, fontSize: "0.96rem", lineHeight: 1.65, color: "#42536D" }}>
                      {comment.body}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography sx={{ fontSize: "0.96rem", color: "#5A6A84" }}>
                  No comments yet. Add the first review note to start the thread.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={2.5}>
          {canManageChangeOrder ? (
            <Paper elevation={0} sx={{ p: 3.2, borderRadius: 4, backgroundColor: "#FFFFFF" }}>
              <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: "#00342B" }}>Approval Actions</Typography>
              <Stack spacing={1.2} sx={{ mt: 2.2 }}>
                {[
                  { status: "approved" as const, label: "Approve", backgroundColor: "#9DEFDE", color: "#0F6F62" },
                  { status: "rejected" as const, label: "Reject", backgroundColor: "#FFDBD1", color: "#872000" },
                  { status: "pending_review" as const, label: "Return to Review", backgroundColor: "#D5ECF8", color: "#00342B" },
                  { status: "synced" as const, label: "Mark Synced", backgroundColor: "#00342B", color: "#FFFFFF" }
                ].map((action) => (
                  <ButtonBase
                    key={action.status}
                    onClick={() => handleStatusUpdate(action.status)}
                    disabled={updatingStatus !== null}
                    sx={{
                      justifyContent: "flex-start",
                      px: 2.2,
                      py: 1.4,
                      borderRadius: 2.8,
                      backgroundColor: action.backgroundColor,
                      color: action.color,
                      opacity: updatingStatus && updatingStatus !== action.status ? 0.55 : 1
                    }}
                  >
                    <Typography sx={{ fontSize: "0.94rem", fontWeight: 800 }}>
                      {updatingStatus === action.status ? "Updating..." : action.label}
                    </Typography>
                  </ButtonBase>
                ))}
              </Stack>
            </Paper>
          ) : null}

          <Paper elevation={0} sx={{ p: 3.2, borderRadius: 4, backgroundColor: "#FFFFFF" }}>
            <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: "#00342B" }}>Activity Timeline</Typography>
            <Stack spacing={1.5} sx={{ mt: 2.2 }}>
              {activity.length > 0 ? (
                activity.map((item) => (
                  <Box key={item.id} sx={{ p: 2, borderRadius: 3, backgroundColor: "#F8FBFF" }}>
                    <Typography sx={{ fontSize: "0.92rem", fontWeight: 800, color: "#00342B" }}>
                      {activityLabel(item)}
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: "0.84rem", color: "#7A869F" }}>
                      {formatDateTime(item.createdAt)}
                    </Typography>
                    {activityDescription(item) ? (
                      <Typography sx={{ mt: 0.85, fontSize: "0.88rem", lineHeight: 1.55, color: "#42536D" }}>
                        {activityDescription(item)}
                      </Typography>
                    ) : null}
                  </Box>
                ))
              ) : (
                <Typography sx={{ fontSize: "0.96rem", color: "#5A6A84" }}>
                  Activity will appear here as the review moves through approval.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Box>

      <WorkspaceFooter />
      {canManageChangeOrder ? (
        <EditChangeOrderModal
          open={editModalOpen}
          changeOrder={changeOrder}
          projects={projects.filter((entry) => !entry.archivedAt && (user?.role === "admin" || entry.ownerId === user?.id))}
          onClose={() => setEditModalOpen(false)}
          onSaved={async (updatedChangeOrder) => {
            setChangeOrder(updatedChangeOrder);
            setEditModalOpen(false);
            setMessage("Change order updated.");
            const nextActivity = await getChangeOrderActivity(updatedChangeOrder.id);
            setActivity(nextActivity);
          }}
        />
      ) : null}
    </Stack>
  );
}
