import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="layout">
      <nav>
        <NavLink to="/" className="brand" end>
          CORTANA
        </NavLink>
        <NavLink to="/" end>
          Nova demanda
        </NavLink>
        <NavLink to="/history">Histórico</NavLink>
        <NavLink to="/settings">Configurações</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
