import { useState } from 'react'
import { createUser, saveToken } from '@/lib/api'
import '@/styles/homePage.css';
import Calendar from 'react-calendar';
import 'bootstrap/dist/css/bootstrap.min.css'





export default function SchedulesTool() {
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

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
        <div className="main-content ">
          <div className="row">
            
            <div className="col-md-3">
              {selectedDate ? (
                <div className="card p-2 mb-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-1">Details</h5>
                      <div className="text-muted">{selectedDate.toDateString()}</div>
                    </div>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setSelectedDate(null)} />
                  </div>

                  <hr />
                  <div>
                    <p className="mb-1"><strong>Events</strong></p>
                    <ul className="list-unstyled">
                      <li>Add and employee here</li>
                    </ul>
                    <button className="btn btn-sm btn-primary mt-2">Add employee</button>
                  </div>
                </div>
              ) : (
                <div className="card p-3 mb-3 text-center text-muted">
                  Click a date to view details
                </div>
              )}
            </div>

            {/* right: calendar */}
            <div className="col-md-9">
              <Calendar
                onChange={(d) => setDate(d)}
                onClickDay={(d) => setSelectedDate(d)}
                value={date}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
