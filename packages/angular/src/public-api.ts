/*
 * Public API of @orca-ui/angular.
 * Styles: add '@orca-ui/core/style.css' to your global styles once.
 */
export * from './lib/button';
export * from './lib/forms';
export * from './lib/display';
export * from './lib/tooltip';
export * from './lib/navigation';
export * from './lib/data-table';
export * from './lib/overlay';
export * from './lib/toast';
export * from './lib/theme';
export { cx, getPageItems, initialsOf, type PageItem, type Variant } from './lib/utils';
export { applyTheme, saveTheme, loadTheme, THEME_STORAGE_KEY } from '@orca-ui/core/theme';

import { OcButton } from './lib/button';
import { OcCheckbox, OcInput, OcRadioGroup, OcSegmented, OcSelect, OcSlider, OcSwitch, OcTextarea } from './lib/forms';
import {
  OcAlert,
  OcAvatar,
  OcBadge,
  OcCard,
  OcCardFooter,
  OcCardHeader,
  OcDivider,
  OcEmptyAction,
  OcEmptyState,
  OcProgressBar,
  OcSkeleton,
  OcSkeletonCard,
  OcSkeletonText,
  OcSpinner,
  OcStepper,
  OcTag,
  OcTimeline,
} from './lib/display';
import { OcTooltip } from './lib/tooltip';
import { OcAccordion, OcAccordionPanel, OcBreadcrumb, OcPagination, OcTabPanel, OcTabs } from './lib/navigation';
import { OcCell, OcDataTable } from './lib/data-table';
import { OcDialog, OcDialogFooter, OcDrawer } from './lib/overlay';
import { OcToaster } from './lib/toast';

/** Every Orca UI component and directive, for `imports: [ORCA_UI]`. */
export const ORCA_UI = [
  OcButton,
  OcInput,
  OcTextarea,
  OcSelect,
  OcCheckbox,
  OcSwitch,
  OcRadioGroup,
  OcSegmented,
  OcSlider,
  OcBadge,
  OcTag,
  OcAvatar,
  OcCard,
  OcCardHeader,
  OcCardFooter,
  OcAlert,
  OcEmptyState,
  OcEmptyAction,
  OcDivider,
  OcSpinner,
  OcSkeleton,
  OcSkeletonText,
  OcSkeletonCard,
  OcProgressBar,
  OcStepper,
  OcTimeline,
  OcTooltip,
  OcTabs,
  OcTabPanel,
  OcAccordion,
  OcAccordionPanel,
  OcBreadcrumb,
  OcPagination,
  OcDataTable,
  OcCell,
  OcDialog,
  OcDrawer,
  OcDialogFooter,
  OcToaster,
] as const;
