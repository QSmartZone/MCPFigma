/**
 * Handler registry exports.
 * Registers all 20 read handlers from Task 4, Task 5, and Task 6.
 */

import { registerHandler } from "../dispatcher";
import { handleGetDocument } from "./read/get-document";
import { handleGetSelection } from "./read/get-selection";
import { handleGetNode } from "./read/get-node";
import { handleGetNodesInfo } from "./read/get-nodes-info";
import { handleGetMetadata } from "./read/get-metadata";
import { handleGetPages } from "./read/get-pages";
import { handleGetViewport } from "./read/get-viewport";
import { handleGetFonts } from "./read/get-fonts";
import { handleSearchNodes } from "./read/search-nodes";
import { handleGetAnnotations } from "./read/get-annotations";
import { handleGetDesignContext } from "./read/get-design-context";
import { handleGetReactions } from "./read/get-reactions";
import { handleGetStyles } from "./read/get-styles";
import { handleGetVariableDefs } from "./read/get-variable-defs";
import { handleGetLocalComponents } from "./read/get-local-components";
import { handleExportTokens } from "./read/export-tokens";
import { handleScanTextNodes } from "./read/scan-text-nodes";
import { handleScanNodesByTypes } from "./read/scan-nodes-by-types";
import { handleGetScreenshot } from "./read/get-screenshot";
import { handleExportFramesToPdf } from "./read/export-frames-to-pdf";

// Task 7: create handlers
import { handleCreateFrame } from "./create/create-frame";
import { handleCreateRectangle } from "./create/create-rectangle";
import { handleCreateEllipse } from "./create/create-ellipse";
import { handleCreateText } from "./create/create-text";
import { handleImportImage } from "./create/import-image";
import { handleCreateComponent } from "./create/create-component";
import { handleCreateSection } from "./create/create-section";

// Task 8: modify handlers (11 property setters)
import { handleSetText } from "./modify/set-text";
import { handleSetFills } from "./modify/set-fills";
import { handleSetStrokes } from "./modify/set-strokes";
import { handleRenameNode } from "./modify/rename-node";
import { handleSetOpacity } from "./modify/set-opacity";
import { handleSetCornerRadius } from "./modify/set-corner-radius";
import { handleSetAutoLayout } from "./modify/set-auto-layout";
import { handleSetVisible } from "./modify/set-visible";
import { handleSetBlendMode } from "./modify/set-blend-mode";
import { handleSetConstraints } from "./modify/set-constraints";
import { handleSetEffects } from "./modify/set-effects";

// Task 9: modify handlers (13 structural ops)
import { handleMoveNodes } from "./modify/move-nodes";
import { handleResizeNodes } from "./modify/resize-nodes";
import { handleCloneNode } from "./modify/clone-node";
import { handleLockNodes } from "./modify/lock-nodes";
import { handleUnlockNodes } from "./modify/unlock-nodes";
import { handleRotateNodes } from "./modify/rotate-nodes";
import { handleReorderNodes } from "./modify/reorder-nodes";
import { handleReparentNodes } from "./modify/reparent-nodes";
import { handleBatchRenameNodes } from "./modify/batch-rename-nodes";
import { handleFindReplaceText } from "./modify/find-replace-text";
import { handleDeleteNodes } from "./modify/delete-nodes";
import { handleGroupNodes } from "./modify/group-nodes";
import { handleUngroupNodes } from "./modify/ungroup-nodes";

// Task 10: styles handlers (7 handlers)
import { handleCreatePaintStyle } from "./styles/create-paint-style";
import { handleCreateTextStyle } from "./styles/create-text-style";
import { handleCreateEffectStyle } from "./styles/create-effect-style";
import { handleCreateGridStyle } from "./styles/create-grid-style";
import { handleUpdatePaintStyle } from "./styles/update-paint-style";
import { handleDeleteStyle } from "./styles/delete-style";
import { handleApplyStyleToNode } from "./styles/apply-style-to-node";

// Task 10: variables handlers (6 handlers)
import { handleCreateVariableCollection } from "./variables/create-variable-collection";
import { handleCreateVariable } from "./variables/create-variable";
import { handleSetVariableValue } from "./variables/set-variable-value";
import { handleAddVariableMode } from "./variables/add-variable-mode";
import { handleBindVariableToNode } from "./variables/bind-variable-to-node";
import { handleDeleteVariable } from "./variables/delete-variable";

// Task 11: components handlers (2 handlers)
import { handleSwapComponent } from "./components/swap-component";
import { handleDetachInstance } from "./components/detach-instance";

// Task 11: pages handlers (4 handlers)
import { handleAddPage } from "./pages/add-page";
import { handleDeletePage } from "./pages/delete-page";
import { handleRenamePage } from "./pages/rename-page";
import { handleNavigateToPage } from "./pages/navigate-to-page";

// Task 11: prototype handlers (2 handlers)
import { handleSetReactions } from "./prototype/set-reactions";
import { handleRemoveReactions } from "./prototype/remove-reactions";

// Register Task 4 read handlers (10 handlers)
registerHandler("get_document", handleGetDocument);
registerHandler("get_selection", handleGetSelection);
registerHandler("get_node", handleGetNode);
registerHandler("get_nodes_info", handleGetNodesInfo);
registerHandler("get_metadata", handleGetMetadata);
registerHandler("get_pages", handleGetPages);
registerHandler("get_viewport", handleGetViewport);
registerHandler("get_fonts", handleGetFonts);
registerHandler("search_nodes", handleSearchNodes);
registerHandler("get_annotations", handleGetAnnotations);

// Register Task 5 read handlers (6 handlers)
registerHandler("get_design_context", handleGetDesignContext);
registerHandler("get_reactions", handleGetReactions);
registerHandler("get_styles", handleGetStyles);
registerHandler("get_variable_defs", handleGetVariableDefs);
registerHandler("get_local_components", handleGetLocalComponents);
registerHandler("export_tokens", handleExportTokens);

// Register Task 6 read handlers (4 handlers)
registerHandler("scan_text_nodes", handleScanTextNodes);
registerHandler("scan_nodes_by_types", handleScanNodesByTypes);
registerHandler("get_screenshot", handleGetScreenshot);
registerHandler("export_frames_to_pdf", handleExportFramesToPdf);

// Register Task 7 create handlers (7 handlers)
registerHandler("create_frame", handleCreateFrame);
registerHandler("create_rectangle", handleCreateRectangle);
registerHandler("create_ellipse", handleCreateEllipse);
registerHandler("create_text", handleCreateText);
registerHandler("import_image", handleImportImage);
registerHandler("create_component", handleCreateComponent);
registerHandler("create_section", handleCreateSection);

// Register Task 8 modify handlers (11 property setters)
registerHandler("set_text", handleSetText);
registerHandler("set_fills", handleSetFills);
registerHandler("set_strokes", handleSetStrokes);
registerHandler("rename_node", handleRenameNode);
registerHandler("set_opacity", handleSetOpacity);
registerHandler("set_corner_radius", handleSetCornerRadius);
registerHandler("set_auto_layout", handleSetAutoLayout);
registerHandler("set_visible", handleSetVisible);
registerHandler("set_blend_mode", handleSetBlendMode);
registerHandler("set_constraints", handleSetConstraints);
registerHandler("set_effects", handleSetEffects);

// Register Task 9 modify handlers (13 structural ops)
registerHandler("move_nodes", handleMoveNodes);
registerHandler("resize_nodes", handleResizeNodes);
registerHandler("clone_node", handleCloneNode);
registerHandler("lock_nodes", handleLockNodes);
registerHandler("unlock_nodes", handleUnlockNodes);
registerHandler("rotate_nodes", handleRotateNodes);
registerHandler("reorder_nodes", handleReorderNodes);
registerHandler("reparent_nodes", handleReparentNodes);
registerHandler("batch_rename_nodes", handleBatchRenameNodes);
registerHandler("find_replace_text", handleFindReplaceText);
registerHandler("delete_nodes", handleDeleteNodes);
registerHandler("group_nodes", handleGroupNodes);
registerHandler("ungroup_nodes", handleUngroupNodes);

// Register Task 10 styles handlers (7 handlers)
registerHandler("create_paint_style", handleCreatePaintStyle);
registerHandler("create_text_style", handleCreateTextStyle);
registerHandler("create_effect_style", handleCreateEffectStyle);
registerHandler("create_grid_style", handleCreateGridStyle);
registerHandler("update_paint_style", handleUpdatePaintStyle);
registerHandler("delete_style", handleDeleteStyle);
registerHandler("apply_style_to_node", handleApplyStyleToNode);

// Register Task 10 variables handlers (6 handlers)
registerHandler("create_variable_collection", handleCreateVariableCollection);
registerHandler("create_variable", handleCreateVariable);
registerHandler("set_variable_value", handleSetVariableValue);
registerHandler("add_variable_mode", handleAddVariableMode);
registerHandler("bind_variable_to_node", handleBindVariableToNode);
registerHandler("delete_variable", handleDeleteVariable);

// Register Task 11 components handlers (2 handlers)
registerHandler("swap_component", handleSwapComponent);
registerHandler("detach_instance", handleDetachInstance);

// Register Task 11 pages handlers (4 handlers)
registerHandler("add_page", handleAddPage);
registerHandler("delete_page", handleDeletePage);
registerHandler("rename_page", handleRenamePage);
registerHandler("navigate_to_page", handleNavigateToPage);

// Register Task 11 prototype handlers (2 handlers)
registerHandler("set_reactions", handleSetReactions);
registerHandler("remove_reactions", handleRemoveReactions);

export { registerHandler } from "../dispatcher";
