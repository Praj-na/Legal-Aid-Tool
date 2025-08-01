import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// Amplify
import { signOut } from "aws-amplify/auth";
import { UserContext } from "../App";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";

const InstructorHeader = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { setIsInstructorAsStudent } = useContext(UserContext);
  const timeoutRef = useRef(null);
  
  const [logo, setLogo] = useState("/logo_dark.svg"); // Default logo

  const handleSignOut = (event) => {
    event.preventDefault();
    signOut()
      .then(() => {
        window.location.href = "/";
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
      });
  };

  // get name:
  useEffect(() => {
    const fetchName = async () => {
      try {
        const session = await fetchAuthSession();
        const userAttributes = await fetchUserAttributes();
        const token = session.tokens.idToken;
        const email = userAttributes.email;

        const response = await fetch(
          `${import.meta.env.VITE_API_ENDPOINT}instructor/name?user_email=${encodeURIComponent(email)}`,
          {
            method: "GET",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        setName(data.name);
      } catch (error) {
        console.error("Error fetching name:", error);
      }
    };

    fetchName();
  }, []);
  
  const updateLogoBasedOnTheme = () => {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setLogo(isDarkMode ? "/logo_dark.svg" : "/logo_light.svg");
  };

  useEffect(() => {
    updateLogoBasedOnTheme();

    const themeChangeListener = (e) => {
      updateLogoBasedOnTheme();
    };
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", themeChangeListener);

    return () => {
      window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", themeChangeListener);
    };
  }, []);
  
  const toggleAccountMenu = () => {
    setIsAccountMenuOpen(!isAccountMenuOpen);
  };
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current); // Clear the timeout if mouse re-enters before it closes
    }
  };

  const handleMouseLeave = (menuType) => {
    timeoutRef.current = setTimeout(() => {
      if (menuType === "account") {
        setIsAccountMenuOpen(false);
      }
    }, 300); // Delay to allow user to move mouse back in quickly if needed
  };


  // This function sets context so that the instructor can view as a student.
  const handleViewAsStudent = () => {
    setIsInstructorAsStudent(true);
  };

  return (
    <header className="bg-[var(--header)] p-4 flex justify-between items-center h-20 fixed top-0 left-0 w-full z-50 shadow-sm">
      {/* Left Section: Logo and Title */}
      <div className="flex items-center" style={{ fontFamily: 'Outfit' }}>
        <img src={logo} alt="Logo" className="h-14 w-14 mr-4" />
        <div style={{ textAlign: 'left' }}>
          <h2 className="text-xl text-[var(--text)] font-semibold">Legal Aid Tool</h2>
          <p className="text-sm text-[var(--text)]">Instructor</p>
        </div>
      </div>

      {/* Right Section: Navigation Buttons */}
      <div className="flex items-center space-x-6">
      <button
          onClick={() => navigate("/home/*")}
          className="flex flex-col items-center bg-transparent text-[var(--header-text)] hover:text-gray-600 focus:outline-none transition-all duration-200"
        >
          <HomeIcon fontSize="large" />
          <span className="mt-1">Home</span>
        </button>

        <button
          onClick={() => navigate("/all-cases")}
          className="flex flex-col items-center bg-transparent text-[var(--header-text)] hover:text-gray-600 focus:outline-none transition-all duration-200"
        >
          <AssignmentIcon fontSize="large" />
          <span className="mt-1">All Cases</span>
        </button>

        {/* Optionally, you can include a "View as Student" button here if needed:
        <button 
          onClick={handleViewAsStudent}
          className="flex flex-col items-center text-white hover:text-gray-300 transition-all duration-200"
        >
          <span className="text-sm">View as Student</span>
        </button>
        */}

        {/* Account Menu */}
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => handleMouseLeave("account")}
        >
          <button
            onClick={toggleAccountMenu}
            className="flex flex-col bg-transparent items-center text-[var(--header-text)] hover:text-gray-600 focus:outline-none transition-all duration-200"
          >
            <AccountCircleIcon fontSize="large" />
            <span className="mt-1">{name}</span>
          </button>
          {isAccountMenuOpen && (
            <div className="absolute right-0 bg-[var(--background)] shadow-lg w-48 p-2 rounded-lg">
              <button
                onClick={handleSignOut}
                className="w-full text-left p-2 bg-[var(--background)] hover:bg-[var(--background2)]"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default InstructorHeader;
