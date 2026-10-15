import { forwardRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { rememberTagSource } from '../util/tagReturnNavigation';

export default forwardRef(function TagNavigationLink({ to, onClick, ...props }, ref) {
  const location = useLocation();
  const navigate = useNavigate();
  return <Link {...props} ref={ref} to={to} onClick={event => {
    onClick?.(event);
    if ((props.target && props.target !== '_self') || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const tagReturn = rememberTagSource(location);
    navigate(to, { state: { ...props.state, tagReturn } });
  }} />;
});
