import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo">🌿 InfoSenior.care</div>
            <p>AI-powered senior care search for families who deserve better than a directory.</p>
          </div>
          <div className="footer-col">
            <h4>For Families</h4>
            <Link to="/search">Find Care</Link>
            <Link to="/chat">Talk to Infomary</Link>
            <Link to="/assessment">Care Quiz</Link>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <Link to="/resources">Knowledge Center</Link>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/auth">Sign in</Link>
            <Link to="/auth?tab=signup">Create account</Link>
            <Link to="/dashboard">My dashboard</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} InfoSenior.care</span>
        </div>
      </div>
    </footer>
  );
}
