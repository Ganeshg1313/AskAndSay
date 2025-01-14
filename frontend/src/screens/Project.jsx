import React, { useEffect, useState, useContext, useRef } from "react";
import Markdown from "markdown-to-jsx";
import { useLocation } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket";
import { UserContext } from "../context/user.context.jsx";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

const Project = () => {
  const location = useLocation();

  const [isSidePanelOpen, setSidePanelOpen] = useState(false);
  const [projectUsers, setProjectUsers] = useState([]);
  const [isAddUsersModalOpen, setAddUsersModalOpen] = useState(false);
  const [currentlyAddedUsers, setCurrentlyAddedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [projectId, setProjectId] = useState(location.state.project._id);
  const [message, setMessage] = useState("");
  const messageBoxRef = useRef(null);

  const [messages, setMessages] = useState([]);

  const { user } = useContext(UserContext);

  function getProjectUsers() {
    axios
      .get(`/projects/get-project/${projectId}`)
      .then((res) => {
        setProjectUsers(res.data.project.users);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function getAllUsers() {
    axios
      .get("/users/all")
      .then((res) => {
        const allFetchedUsers = res.data.users;

        // Filter out users already in the project
        const nonProjectUsers = allFetchedUsers.filter(
          (user) =>
            !projectUsers.some((projectUser) => projectUser._id === user._id)
        );

        setAllUsers(nonProjectUsers);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  const handleSendMessage = () => {
    sendMessage("project-message", {
      message,
      sender: user,
    });
    // appendOutgoingMessage(message);
    setMessages((prevMessages) => [...prevMessages, { sender: user, message }]);
    setMessage("");
  };

  useEffect(() => {
    console.log(user);
    initializeSocket(projectId);

    receiveMessage("project-message", (data) => {
      // console.log(data);
      // appendIncomingMessage(data);
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    getAllUsers();
    getProjectUsers();
  }, []);

  useEffect(() => {
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
    }
  }, [messages]);

  function handleCurrentlyAddedUsers(user) {
    if (currentlyAddedUsers.includes(user)) {
      let users = currentlyAddedUsers.filter((u) => u._id !== user._id);
      setCurrentlyAddedUsers(users);
    } else {
      setCurrentlyAddedUsers((prevUser) => [...prevUser, user]);
    }
  }

  function handleAddUsers() {
    const usersToAdd = currentlyAddedUsers.map((user) => user._id);

    axios
      .put("/projects/add-user", {
        projectId: projectId,
        users: usersToAdd,
      })
      .then((res) => {
        console.log(res);
        getProjectUsers();
        setCurrentlyAddedUsers([]);
        setAddUsersModalOpen(false);
      })
      .catch((error) => {
        console.error("Error adding users:", error);
      });
  }

  const MarkdownOptions = {
    overrides: {
      code: {
        component: ({ className, children }) => {
          const language = className?.replace("lang-", "") || "javascript";
          return (
            <SyntaxHighlighter language={language} style={dracula}>
              {children}
            </SyntaxHighlighter>
          );
        },
      },
    },
  };

  function handleCloseModal() {
    setCurrentlyAddedUsers([]);
    setAddUsersModalOpen(false);
  }

  // function appendIncomingMessage(messageObject) {
  //   const messageBox = document.querySelector(".message-box");

  //   const message = document.createElement("div");
  //   message.classList.add(
  //     "message",
  //     "max-w-56",
  //     "flex",
  //     "flex-col",
  //     "p-2",
  //     "bg-slate-50",
  //     "w-fit",
  //     "rounded-md"
  //   );
  //   if (messageObject.sender._id === "ai") {

  //     const markDown = (<Markdown>{messageObject.message}</Markdown>)

  //     message.innerHTML = `
  //     <small className=\"opacity-65 text-xs\">${messageObject.sender.email}</small>
  //     <p className=\"text-sm\">${markDown}</p>
  //     `

  //   } else {

  //     message.innerHTML = `
  //     <small className=\"opacity-65 text-xs\">${messageObject.sender.email}</small>
  //     <p className=\"text-sm\">${messageObject.message}</p>
  //     `;

  //   }

  //   messageBox.appendChild(message);
  //   if (messageBoxRef.current) {
  //     messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
  //   }
  // }

  // function appendOutgoingMessage(userMessage) {
  //   const messageBox = document.querySelector(".message-box");

  //   const message = document.createElement("div");
  //   message.classList.add(
  //     "message",
  //     "max-w-56",
  //     "ml-auto",
  //     "flex",
  //     "flex-col",
  //     "p-2",
  //     "bg-slate-50",
  //     "w-fit",
  //     "rounded-md"
  //   );
  //   message.innerHTML = `
  //           <small className=\"opacity-65 text-xs\">You</small>
  //           <p className=\"text-sm\">${userMessage}</p>
  //   `;

  //   messageBox.appendChild(message);
  //   if (messageBoxRef.current) {
  //     messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
  //   }
  // }

  return (
    <main className="h-screen w-screen flex relative">
      <section className="left relative flex flex-col h-full min-w-96 bg-slate-300">
        <header className="flex justify-between items-center p-2 px-4 w-full bg-slate-100">
          <button
            onClick={() => setAddUsersModalOpen(!isAddUsersModalOpen)}
            className="flex gap-2"
          >
            <i className="ri-user-add-fill"></i>
            Add Collaborater
          </button>
          <button
            onClick={() => setSidePanelOpen(!isSidePanelOpen)}
            className="p-2"
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>

        <div className="conversation-area flex flex-col h-full overflow-hidden">
          <div
            ref={messageBoxRef}
            className="message-box p-2 flex-grow flex flex-col gap-2 overflow-y-auto"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message max-w-80 flex flex-col p-2 bg-slate-50 w-fit rounded-md ${
                  message.sender._id === user._id ? "ml-auto" : ""
                } ${
                  message.sender._id === "ai" ? "bg-slate-800 text-white" : ""
                }`}
              >
                <small className="opacity-65 text-xs">
                  {message.sender.email}
                </small>
                {message.sender._id === "ai" ? (
                  <Markdown
                    options={MarkdownOptions}
                    className="break-words whitespace-pre-wrap"
                  >
                    {message.message}
                  </Markdown>
                ) : (
                  <p className="break-words whitespace-pre-wrap text-sm">
                    {message.message}
                  </p>
                )}
              </div>
            ))}
            {/* <div className="incoming message max-w-56 flex flex-col p-2 bg-slate-50 w-fit rounded-md">
              <small className="opacity-65 text-xs">example@gmail.com</small>
              <p className="text-sm">Lorem ipsum dolor sit amet.</p>
            </div>
            <div className="outgoing message max-w-56 ml-auto flex flex-col p-2 bg-slate-50 w-fit rounded-md">
              <small className="opacity-65 text-xs">You</small>
              <p className="text-sm">Lorem ipsum dolor sit amet.</p>
            </div> */}
          </div>
          <div className="inputField w-full flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message"
              className="flex-grow p-2 px-4 border-none outline-none"
            />
            <button
              onClick={handleSendMessage}
              className="px-5 bg-slate-900 text-white"
            >
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>

        <div
          className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-50 absolute top-0 transition-all ${
            isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <header className="flex justify-end p-4 px-5 bg-slate-200">
            <button
              className="font-bold"
              onClick={() => setSidePanelOpen(!isSidePanelOpen)}
            >
              <i className="ri-close-fill"></i>
            </button>
          </header>

          <div className="users flex flex-col gap-2">
            {projectUsers?.map((user) => (
              <div
                key={user._id}
                className="user p-2 flex gap-2 item-center cursor-pointer hover:bg-slate-200"
              >
                <div className="w-fit h-fit aspect-square rounded-full flex items-center justify-center p-5 text-white bg-slate-600">
                  <i className="ri-user-fill absolute"></i>
                </div>
                <h1 className="font-semibold text-lg text-black">
                  {user.email}
                </h1>
              </div>
            ))}
          </div>
        </div>
      </section>
      {isAddUsersModalOpen && (
        <div className="w-1/2 max-h-20 absolute flex items-center rounded-lg justify-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 shadow-lg">
          <div className="w-full h-full flex flex-col gap-2 bg-slate-50 rounded-lg p-4">
            <header className="w-full flex justify-between">
              <h2 className="text-black font-semibold text-lg">Select Users</h2>
              <i
                onClick={handleCloseModal}
                className="ri-close-fill font-semibold cursor-pointer"
              ></i>
            </header>
            <div className="w-full flex flex-col gap-2">
              {allUsers.map((user) => (
                <li
                  key={user._id}
                  onClick={() => handleCurrentlyAddedUsers(user)}
                  className={`${
                    currentlyAddedUsers.includes(user)
                      ? "bg-green-400"
                      : "bg-slate-200"
                  } p-2 list-none text-lg rounded-sm cursor-pointer hover:font-semibold`}
                >
                  {user.email}
                </li>
              ))}
            </div>
            <button
              onClick={handleAddUsers}
              className="bg-blue-600 text-white text-lg font-semibold p-2 rounded-sm hover:bg-blue-800"
            >
              Add Users
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;
