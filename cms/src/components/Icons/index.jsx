import React from 'react';
import { 
  Phone, 
  Text,
  Plus,
  Trash2,
  Save,
  Edit,
  X,
  GripVerticalIcon
} from 'lucide-react';

export const Call = () => <Phone size={20} />;
export const HamBurger = () => <Text size={20} />;
export const PlusIcon = () => <Plus size={20} />;
export const TrashIcon = () => <Trash2 size={20} />;
export const SaveIcon = () => <Save size={20} />;
export const EditIcon = () => <Edit size={20} />;
export const XIcon = () => <X size={20} />;
export const GripIcon = () => <GripVerticalIcon size={20} />;

const Icons = {
  Call,
  HamBurger,
  PlusIcon,
  TrashIcon,
  SaveIcon,
  EditIcon,
  XIcon,
  GripIcon
};

export default Icons;