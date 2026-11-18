import React from 'react';
import { Link } from 'react-router-dom';
import { labels } from '../pageRegistry';

export default function Footer(){return <footer className="spa-footer"><div className="wrap"><div><strong>Seerweb ERP Solution Pvt. Ltd.</strong><p>Business software, Tally and support solutions.</p></div><div className="spa-footerlinks">{Object.entries(labels).map(([path,label])=><Link key={path} to={path}>{label}</Link>)}</div></div></footer>}
