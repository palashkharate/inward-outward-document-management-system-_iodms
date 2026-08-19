/**
 * FR-200: Dynamic UI Terminology Dictionary.
 *
 * This file contains the two sets of labels the Admin can switch between:
 * - "canonical" — the modern terms used in the SRS (Folder ID, Compose Outward, etc.)
 * - "legacy"   — the older terms officers may be more familiar with (File Number, Create File, etc.)
 *
 * Every user-facing label that could differ between the two sets is stored here
 * under a stable key (e.g. lbl_folder_id). Components call t('lbl_folder_id')
 * and the correct text is returned based on the Admin's chosen mode.
 */

// FR-200: The two terminology dictionaries
const TERMINOLOGY = {
  canonical: {
    // Navigation & page titles
    lbl_compose_outward:       'Compose Outward',
    lbl_drafts_dispatch:       'Drafts & Dispatch',
    lbl_log_inward:            'Log Inward',
    lbl_inward_register:       'Inward Register',
    lbl_outward_register:      'Outward Register',

    // Field labels used across forms and tables
    lbl_folder_id:             'Folder ID',
    lbl_folder_name:           'Folder Name',
    lbl_folder:                'Folder',
    lbl_folder_categories:     'Folder Categories',
    lbl_outward_no:            'Outward No.',
    lbl_inward_no:             'Inward No.',
    lbl_prepared_by:           'Prepared By',
    lbl_address_group:         'Address Group',
    lbl_address_to:            'Address To',
    lbl_assign_to:             'Assign To',
    lbl_document_type:         'Document Type',
    lbl_received_from:         'Received From',
    lbl_originated_by:         'Originated By',

    // Action buttons
    lbl_dispatch:              'Dispatch',
    lbl_dispatch_document:     'Dispatch Document',
    lbl_discard_draft:         'Discard Draft',
    lbl_save_draft:            'Save Draft',
    lbl_save_inward:           'Save Inward Entry',
    lbl_modify_inward:         'Modify Inward',
    lbl_pending_dispatch:      'Pending Dispatch',

    // Page titles
    lbl_compose_outward_title: 'Compose Outward Document',
    lbl_modify_outward_title:  'Modify Outward Record',
    lbl_log_inward_title:      'Log Inward Document',
    lbl_modify_inward_title:   'Modify Inward Details',
    lbl_drafts_dispatch_title: 'Drafts & Dispatch Register',

    // Dashboard
    lbl_inward_this_year:      'Inward This Year',
    lbl_outward_this_year:     'Outward This Year',
    lbl_active_drafts:         'Active Drafts',
    lbl_files_by_folder:       'Files by Folder',
    lbl_logged_inward:         'Logged Inward',
    lbl_prepared_outward:      'Prepared Outward',

    // Admin panel
    lbl_log_inward_prev_year:      'Log Inward (Previous Year)',
    lbl_compose_outward_prev_year: 'Compose Outward (Previous Year)',
    lbl_received_from_origins:     'Received From Origins',
    lbl_originated_by_senders:     'Originated By Senders',
    lbl_address_groups:            'Address Groups',
  },

  legacy: {
    // Navigation & page titles
    lbl_compose_outward:       'Create File',
    lbl_drafts_dispatch:       'Finalise File',
    lbl_log_inward:            'Inward Entry',
    lbl_inward_register:       'Inward Register',
    lbl_outward_register:      'Outward Register',

    // Field labels
    lbl_folder_id:             'File Number',
    lbl_folder_name:           'File Name',
    lbl_folder:                'File',
    lbl_folder_categories:     'File Categories',
    lbl_outward_no:            'Register No.',
    lbl_inward_no:             'Dept Inward No.',
    lbl_prepared_by:           'Created By',
    lbl_address_group:         'Category',
    lbl_address_to:            'Address To',
    lbl_assign_to:             'Referred To',
    lbl_document_type:         'Type',
    lbl_received_from:         'Received From',
    lbl_originated_by:         'Originated By',

    // Action buttons
    lbl_dispatch:              'Finalise',
    lbl_dispatch_document:     'Finalise Document',
    lbl_discard_draft:         'Move to Trash',
    lbl_save_draft:            'Save File',
    lbl_save_inward:           'Save Inward Entry',
    lbl_modify_inward:         'Modify Inward',
    lbl_pending_dispatch:      'Pending Finalise',

    // Page titles
    lbl_compose_outward_title: 'Create New File',
    lbl_modify_outward_title:  'Modify Outward Record',
    lbl_log_inward_title:      'Log Inward Entry',
    lbl_modify_inward_title:   'Modify Inward Details',
    lbl_drafts_dispatch_title: 'Finalise File Register',

    // Dashboard
    lbl_inward_this_year:      'Inward This Year',
    lbl_outward_this_year:     'Outward This Year',
    lbl_active_drafts:         'Active Drafts',
    lbl_files_by_folder:       'Files by File Category',
    lbl_logged_inward:         'Logged Inward',
    lbl_prepared_outward:      'Created Outward',

    // Admin panel
    lbl_log_inward_prev_year:      'Inward Entry (Previous Year)',
    lbl_compose_outward_prev_year: 'Create File (Previous Year)',
    lbl_received_from_origins:     'Received From Origins',
    lbl_originated_by_senders:     'Originated By Senders',
    lbl_address_groups:            'Categories',
  }
};

export default TERMINOLOGY;
