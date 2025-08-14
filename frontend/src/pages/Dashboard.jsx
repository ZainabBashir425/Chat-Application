import React from 'react'
import Header from '../components/layout/header'
import { ToastContainer } from 'react-toastify'
import "react-toastify/dist/ReactToastify.css";
import ChatApp from './Chat/Chat';

function Dashboard() {
  return (
    <>
    <Header/> 
    <ChatApp/>
    <ToastContainer position="top-right" autoClose={3000}/>
    </>
  )
}

export default Dashboard