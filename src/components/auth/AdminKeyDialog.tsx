import { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from '@mui/material';

interface AdminKeyDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (adminKey: string) => void;
}

const AdminKeyDialog = ({ open, onClose, onSave }: AdminKeyDialogProps) => {
  const [adminKey, setAdminKey] = useState('');

  useEffect(() => {
    // Load existing admin key from localStorage if available
    const savedKey = localStorage.getItem('adminKey');
    if (savedKey) {
      setAdminKey(savedKey);
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem('adminKey', adminKey);
    onSave(adminKey);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Admin Key Required</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please enter your admin key to access business owner data.
          This key will be saved in your browser for future use.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="Admin Key"
          type="password"
          fullWidth
          variant="outlined"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!adminKey}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminKeyDialog; 