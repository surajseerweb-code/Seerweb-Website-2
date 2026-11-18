import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { products, services } from '../pageRegistry';

export default function Navigation(){const loc=useLocation();const[open,setOpen]=useState(false);useEffect(()=>setOpen(false),[loc.pathname]);
 const item=(label,path)=><Link className={loc.pathname===path?'current':''} to={path}>{label}</Link>;
 return <><div className="strip"><div className="wrap"><span>📍 Office 1902, G Square Business Park, Sector 30A, Vashi, Navi Mumbai</span><span><a href="mailto:sales@seerweb.in">sales@seerweb.in</a></span></div></div><header className="nav"><div className="wrap"><Link className="logo" to="/"><span className="logo-mark">S</span><span>Seerweb<small>ERP SOLUTION PVT. LTD.</small></span></Link><button type="button" className="spa-toggle" aria-expanded={open} onClick={()=>setOpen(!open)}>☰ Menu</button><nav className={'spa-menu '+(open?'open':'')} aria-label="Main navigation"><ul>
 <li>{item('Home','/')}</li><li>{item('About','/about')}</li>
 <li className="spa-dropdown">{item('Products','/products')}<button aria-label="Show products" className="spa-caret" type="button" onClick={e=>e.currentTarget.parentElement.classList.toggle('expanded')}>⌄</button><ul className="spa-submenu">{products.map(([n,p])=><li key={p}>{item(n,p)}</li>)}</ul></li>
 <li className="spa-dropdown">{item('Services','/services')}<button aria-label="Show services" className="spa-caret" type="button" onClick={e=>e.currentTarget.parentElement.classList.toggle('expanded')}>⌄</button><ul className="spa-submenu">{services.map(([n,p])=><li key={p}>{item(n,p)}</li>)}</ul></li>
 <li>{item('Solutions','/solutions')}</li><li>{item('Blog','/blog')}</li><li>{item('Contact','/contact')}</li></ul></nav><Link className="btn btn-primary spa-cta" to="/enquire">Enquire Now</Link></div></header></>}
