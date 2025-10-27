import { useState } from 'react'
import { createUser, saveToken } from '@/lib/api'
import Calendar from 'react-calendar';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/homePage.css';
import '@/styles/auth.css';

export default function ManagerHome() {
    const [date, setDate] = useState(new Date());
  
    return (
    
    <div className="home-container justify-content-start">
      <div className="clock clock--green" />
      <div className="clock clock--purple" />
      <div className="clock clock--orange" />
      <div className="clock clock--green"><i /></div>
      <div className="clock clock--purple"><i /></div>
      <div className="clock clock--orange"><i /></div>
      
      
      
      <div className="home-header mb-4">
        <h1>Good Work</h1>
      </div>
      <p>Bussince code</p>
      <div className="content-wrapper">
        <nav className="vertical-navbar">
          <button type="button" className="btn mb-3 d-flex flex-column align-items-center" disabled>
            <img src="/img/logActivityIcon.png" alt="Log Activity" />
            Log Activity
          </button>
          <button type="button" className="btn mb-3 d-flex flex-column align-items-center" disabled>
            <img src="/img/calenderIcon.png" alt="Schedules" />
            Schedules
          </button>
          <button type="button" className="btn mb-3 d-flex flex-column align-items-center" disabled>
            <img src="/img/monitorActivityIcon.png" alt="Monitor Activity" />
            Monitor Activity
          </button>
            <button type="button" className="btn mb-3 d-flex flex-column align-items-center" disabled>
               <img src="/img/alertIcon.png" alt="Alerts" />
                Alerts
            </button>
            <button type="button" className="btn mb-3 d-flex flex-column align-items-center" disabled>
               <img src="/img/accountIcon.png" alt="account" />
               accounts
            </button>
            <button type="button" className="btn mb-3 d-flex flex-column align-items-center" disabled>
               <img src="/img/myPayIcon.png" alt="My pay" />
               My Pay
            </button>
        </nav>
        <div className="content-wrapper ">
            <Calendar onChange={setDate} value={date} />
        </div>
      </div>
    </div>
  );
}