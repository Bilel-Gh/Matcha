import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const PublicLayout: React.FC = () => {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/register">Register</Link>
          </li>
        </ul>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
