import {
  Typography,
  Box,
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  TableFooter,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import { useState, useEffect } from "react";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InstructorDetails from "./InstructorDetails";

function titleCase(str) {
  if (typeof str !== "string") {
    return str;
  }
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const fetchInstructors = async () => {
  try {
    const session = await fetchAuthSession();
    const userAttributes = await fetchUserAttributes();
    const token = session.tokens.idToken;
    const adminEmail = userAttributes.email;

    const response = await fetch(
      `${import.meta.env.VITE_API_ENDPOINT}admin/instructors?instructor_email=${adminEmail}`,
      {
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return [];
  }
};

const createData = (user, last, email, id) => {
  return { user, last, email, id };
};

function getInstructorInfo(groupsArray) {
  return groupsArray.map((instructor) =>
    createData(
      instructor.first_name || "Waiting for user to sign up",
      instructor.last_name || "Waiting for user to sign up",
      instructor.user_email, 
      instructor.user_id
    )
  );
}

export const AdminInstructors = () => {
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openInstructorDetails, setOpenInstructorDetails] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  const refreshInstructors = async () => {
    setLoading(true);
    try {
      const data = await fetchInstructors();
      setRows(getInstructorInfo(data));
    } catch (error) {
      console.error("Error loading instructors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshInstructors(); // Initial fetch
  }, []);

  const handleSearchChange = (event) => setSearchQuery(event.target.value);

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredRows = rows.filter((row) =>
    row.user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRowClick = (instructor) => {
    setSelectedInstructor(instructor);
    setOpenInstructorDetails(true);
  };

  const handleCloseInstructorDetails = () => {
    setOpenInstructorDetails(false);
    setSelectedInstructor(null);
  };

  const handleAddInstructor = async (email) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;
      const existingInstructor = rows.find((row) => row.email === email);
      if (existingInstructor) {
        toast.error(`Instructor with email ${email} already exists.`, {
          position: "top-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
        return;
      }
      const response = await fetch(
        `${import.meta.env.VITE_API_ENDPOINT}admin/elevate_instructor?email=${email}`,
        {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error(`Error Status: ${response.status}`);

      toast.success(`Instructor with email ${email} elevated`, {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });

      // Refresh instructors after adding
      refreshInstructors();
      handleCloseAdd();
    } catch (error) {
      console.error("Error elevating instructor", error);
      toast.error("Failed to add instructor", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
    }
  };

  const handleCloseAdd = () => setOpenAddDialog(false);

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 2, marginTop: 0.5, backgroundColor: "var(--background)" }}>
      <Toolbar />
      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
          marginTop: 1,
          borderRadius: 2,
          boxShadow: 'none',
          backgroundColor: "var(--background)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          p: 3,
          maxHeight: "85vh",
        }}
      >
        <Box
          sx={{
            padding: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "var(--text)",
          }}
        >
          <Typography fontStyle="semibold" variant="h6">
            Manage Instructors
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenAddDialog(true)}
            sx={{ fontSize: 14, color: "white", backgroundColor: "var(--primary)", boxShadow: "none", borderRadius: 2 }}
          >
            Add Instructor
          </Button>
        </Box>
        <TableContainer sx={{ maxHeight: "70vh", overflowY: "auto" }}>
          <TextField
            label="Search by User"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ margin: 1, width: "90%" }}
            InputProps={{ sx: { fontSize: 14 } }}
            InputLabelProps={{ sx: { fontSize: 14 } }}
          />
          <Table aria-label="instructors table" style={{ color: "var(--text)" }} >
            {!loading ? (
              <>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "30%", fontSize: 14, color: 'var(--text)' }}>
                      First Name
                    </TableCell>
                    <TableCell sx={{ fontSize: 14, color: 'var(--text)' }}>Last Name</TableCell>
                    <TableCell sx={{ fontSize: 14, color: 'var(--text)' }}>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => (
                      <TableRow
                        key={index}
                        onClick={() => handleRowClick(row)}
                        style={{ cursor: "pointer" }}
                      >
                        <TableCell sx={{ fontSize: 14, color: 'var(--text)' }}>
                          {titleCase(row.user)}
                        </TableCell>
                        <TableCell sx={{ fontSize: 14, color: 'var(--text)' }}>
                          {titleCase(row.last)}
                        </TableCell>
                        <TableCell sx={{ fontSize: 14, color: 'var(--text)' }}>{row.email}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </>
            ) : (
              <TableBody>loading...</TableBody>
            )}
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredRows.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{ fontSize: 14, minWidth: 400, color: 'var(--text)' }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>

{/* Add instructor dialog */}
      <Dialog
  open={openAddDialog}
  onClose={handleCloseAdd}
  sx={{
    "& .MuiDialog-container": {
      "& .MuiPaper-root": {
        width: "100%",
        maxHeight: 500,
      }
    }
  }}
  PaperProps={{
    component: "form",
    sx: {
      backgroundColor: "var(--background)",
      boxShadow: "none",
      border: "1px solid var(--border)",
    },
    onSubmit: (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email");
      handleAddInstructor(email);
    },
  }}
>
  <DialogTitle style={{ color: "var(--text)", backgroundColor: "var(--background)" }}>
    Add an Instructor
  </DialogTitle>

  <DialogContent style={{ color: "var(--text)", backgroundColor: "var(--background)" }}>
    <DialogContentText style={{ color: "var(--text)", backgroundColor: "var(--background)" }}>
      Please enter the email of the instructor here
    </DialogContentText>

    <TextField
      autoFocus
      required
      margin="dense"
      id="name"
      name="email"
      label="Email Address"
      type="email"
      fullWidth
      variant="standard"
      inputProps={{ maxLength: 40 }}
      sx={{
        '& .MuiInputBase-input': {
          color: 'var(--text)',
        },
        '& .MuiInputLabel-root': {
          color: 'var(--placeholder-text)',
        },
        '& .MuiInput-underline:before': {
          borderBottomColor: 'var(--border)',
        },
        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
          borderBottomColor: 'var(--border)',
        },
        '& .MuiInput-underline:after': {
          borderBottomColor: 'var(--border)',
        }
      }}
    />
  </DialogContent>

  <DialogActions style={{ color: "var(--text)", backgroundColor: "var(--background)" }}>
    <Button onClick={handleCloseAdd}>Cancel</Button>
    <Button type="submit">Submit</Button>
  </DialogActions>
</Dialog>

{/* Instructor details dialog */}
<Dialog
  open={openInstructorDetails}
  onClose={handleCloseInstructorDetails}
  maxWidth="md"
  fullWidth
  PaperProps={{
    sx: {
      backgroundColor: "var(--background)",
      boxShadow: "none",
      border: "1px solid var(--border)",
      color: "var(--text)",
    },
  }}
>
  <DialogContent sx={{ backgroundColor: "var(--background)", color: "var(--text)" }}>
    {selectedInstructor && (
      <InstructorDetails
        instructorData={selectedInstructor}
        onBack={() => {
          handleCloseInstructorDetails();
          refreshInstructors();
        }}
      />
    )}
  </DialogContent>
</Dialog>

      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </Box>
  );
};

export default AdminInstructors;
