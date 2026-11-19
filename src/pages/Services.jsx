// src/pages/Services.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { toast } from 'react-toastify';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { trackEvent } from '../utils/analytics';
import { useCartNotice } from '../components/CartNotice';
import { useCartDrawer } from '../components/CartDrawer';


const fadeInUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.77, 0, 0.18, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [sortedServices, setSortedServices] = useState([]);
  const [error, setError] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [addingToCart, setAddingToCart] = useState(null);
  const [highlightedService, setHighlightedService] = useState(null);
  const [showAlreadyClaimedModal, setShowAlreadyClaimedModal] = useState(false);
  const trackedServices = useRef(new Set());
  
  // Get cart from context
  const { cart, addToCart } = useContext(CartContext);
  const { showAdded } = useCartNotice();
  const { openCart } = useCartDrawer();
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, refreshUserData } = useContext(AuthContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:10000';
  const navigate = useNavigate();
  const location = useLocation();
  
  // Refs for service cards
  const servicesSectionRef = useRef(null);
  const serviceCardRefs = useRef({});

  //
  useEffect(() => {
    if (!sortedServices.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const serviceId = entry.target.dataset.serviceId;

          const service = sortedServices.find(
            s => String(s.id) === serviceId
          );

          if (!service) return;

          if (trackedServices.current.has(service.id)) return;

          trackedServices.current.add(service.id);

          trackEvent('view_item', {
            currency: 'GHS',
            value: service.price,
            items: [
              {
                item_id: String(service.id),
                item_name: service.name,
                item_category: service.service_type || 'Cleaning',
                price: service.price,
                quantity: service.included_quantity || 1
              }
            ]
          });
        });
      },
      { threshold: 0.5 }
    );

    Object.values(serviceCardRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sortedServices]);

  // Check if there's a service ID to highlight from location state
  useEffect(() => {
    if (location.state?.highlightServiceId) {
      const serviceId = location.state.highlightServiceId;
      setHighlightedService(serviceId);
      
      setTimeout(() => {
        if (servicesSectionRef.current) {
          servicesSectionRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
        
        setTimeout(() => {
          const cardElement = serviceCardRefs.current[serviceId];
          if (cardElement) {
            cardElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
          }
        }, 500);
      }, 300);
      
      if (location.state?.showSuccessMessage) {
        toast.success(location.state.showSuccessMessage, {
          autoClose: 5000,
        });
      }
      
      setTimeout(() => {
        setHighlightedService(null);
        navigate(location.pathname, { replace: true, state: {} });
      }, 5000);
    }
  }, [location.state, navigate, location.pathname]);

  // Check if user has already claimed free service when they return from login
  useEffect(() => {
    const checkFreeServiceStatus = () => {
      if (isAuthenticated && user && user.free_signup_service_used && location.state?.highlightServiceId) {
        setTimeout(() => {
          setShowAlreadyClaimedModal(true);
        }, 1000);
      }
    };
    
    checkFreeServiceStatus();
  }, [isAuthenticated, user, location.state]);

  // Fetch services
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchServices = async () => {
      if (!mounted) return;
      
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        
        let endpoint = `/api/services/public/`;
        
        
        if (isAuthenticated && token) {
          endpoint = `/api/services/authenticated/`;
        }
        
        console.log(`Fetching from: ${endpoint}`);
        console.log(`User authenticated: ${isAuthenticated}`);
        
        const response = await api.get(endpoint)
        const servicesData = response.data;
        
        console.log('Services received:', servicesData);
        
        // Find the standard clean price for savings calculation
        const standardService = servicesData.find(service => 
          service.name.toLowerCase().includes('standard') && 
          !service.service_type?.startsWith('PACKAGE_') &&
          !service.is_free_signup_service
        );
        
        console.log('Standard service found:', standardService);
        
        // Calculate savings for bundle services
        const servicesWithSavings = servicesData.map(service => {
          if (service.service_type?.startsWith('PACKAGE_') && standardService) {
            const sneakerCount = service.included_quantity || 1;
            const individualTotal = standardService.price * sneakerCount;
            const savingsAmount = individualTotal - service.price;
            
            if (savingsAmount > 0) {
              return {
                ...service,
                savingsAmount: savingsAmount.toFixed(2),
                perSneakerPrice: (service.price / sneakerCount).toFixed(2)
              };
            }
          }
          return service;
        });
        
        console.log('Services with savings:', servicesWithSavings);
        
        // Sort services: free services first, then by price
        const sorted = [...servicesWithSavings].sort((a, b) => {
          if (a.is_free_signup_service && !b.is_free_signup_service) return -1;
          if (!a.is_free_signup_service && b.is_free_signup_service) return 1;
          return a.price - b.price;
        });
        
        console.log('Sorted services:', sorted);
        
        if (mounted) {
          setServices(servicesWithSavings);
          setSortedServices(sorted);
        }
        
        if (mounted && isAuthenticated && !user?.free_signup_service_used) {
          console.log('Refreshing user data to get free service info...');
          try {
            await refreshUserData();
          } catch (err) {
            console.error('Failed to refresh user data:', err);
          }
        }
        
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log('Request canceled:', err.message);
          return;
        }
        
        console.error('Error fetching services:', err);
        
        if (err.response?.status === 401) {
          console.log('Authentication failed, falling back to public endpoint');
          
          try {
            const publicResponse = await api.get(`/api/services/public/`, {
              signal: controller.signal
            });
            
            if (mounted) {
              const publicServices = publicResponse.data;
              const sortedPublicServices = [...publicServices].sort((a, b) => {
                if (a.is_free_signup_service && !b.is_free_signup_service) return -1;
                if (!a.is_free_signup_service && b.is_free_signup_service) return 1;
                return a.price - b.price;
              });
              
              setServices(publicServices);
              setSortedServices(sortedPublicServices);
            }
          } catch (fallbackErr) {
            if (mounted && !axios.isCancel(fallbackErr)) {
              setError('Failed to load services.');
              toast.error('Failed to load services. Please try again.');
            }
          }
        } else if (mounted && !axios.isCancel(err)) {
          setError('Failed to load services.');
          toast.error('Failed to load services. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchServices();
    
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [isAuthenticated]);

  const getServiceStatus = (serviceName) => {
    const name = serviceName.toLowerCase();
    const isPriority = name.includes('priority') || name.includes('express') || name.includes('rush');
    
    return {
      isPriority,
      bannerText: isPriority ? 'NEXT DAY' : '72 HOURS',
      badgeText: isPriority ? 'delivered next day' : 'delivered in 72h'
    };
  };

  const isBundleService = (service) => {
    return service?.service_type?.startsWith('PACKAGE_');
  };

  const isEligibleForFreeService = () => {
    return isAuthenticated && user && !user.free_signup_service_used;
  };

  const getUserFreeServiceStatus = () => {
    if (!isAuthenticated || !user) {
      return { 
        isAuthenticated: false, 
        hasUsed: false, 
        serviceName: null 
      };
    }
    return {
      isAuthenticated: true,
      hasUsed: !!user.free_signup_service_used,
      serviceName: user.free_signup_service_used?.name || null
    };
  };

  // Handle free service button click for unauthenticated users
  const handleFreeServiceClick = (service) => {
    if (!isAuthenticated) {
      navigate('/auth/login', { 
        state: { 
          from: '/services',
          message: `Sign in to claim your FREE ${service.name}!`,
          highlightServiceId: service.id
        } 
      });
      return;
    }
    handleAddToCart(service);
  };

  // Handle adding to cart with free service logic - FIXED with safety checks

const handleAddToCart = async (service) => {
  const { id, name, price, is_free_signup_service } = service;
  
  // Free service handling
  if (is_free_signup_service) {
    if (!isAuthenticated) {
      toast.info('Please sign in to claim your free service!');
      navigate('/auth/login', { 
        state: { 
          from: '/services',
          message: `Sign in to claim your FREE ${name}!`,
          highlightServiceId: id 
        } 
      });
      return;
    }
    
    if (user?.free_signup_service_used) {
      setShowAlreadyClaimedModal(true);
      return;
    }
    
    if (!isEligibleForFreeService()) {
      toast.error('You are not eligible for a free service.');
      return;
    }
    
    setAddingToCart(id);
    
    try {
      // Add to cart first
      await addToCart(id, 1, { name, price });
      showAdded({ id, name: `Free ${name}`, price: 0, image: service.image });
    } catch (error) {
      console.error('Error adding free service:', error);
      toast.error('Failed to add free service. Please try again.');
    } finally {
      setAddingToCart(null);
    }
    return;
  }
  
  // Regular service handling
  setAddingToCart(id);
  
  try {
    await addToCart(id, 1, 
      { 
        id: service.id,
        name: service.name,
        price: service.price,
        service_type: service.service_type,
      }
    );
    showAdded({ id, name, price, image: service.image });
  } catch (error) {
    console.error('Error adding service:', error);
    toast.error('Failed to add service to cart. Please try again.');
  } finally {
    setAddingToCart(null);
  }
};

  const toggleDescription = (serviceId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  const scrollToServices = () => {
    if (servicesSectionRef.current) {
      servicesSectionRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const closeAlreadyClaimedModal = () => {
    setShowAlreadyClaimedModal(false);
    navigate(location.pathname, { replace: true, state: {} });
  };

  // Already-claimed free service
  const renderAlreadyClaimedModal = () => {
    const freeServiceStatus = getUserFreeServiceStatus();
    if (!showAlreadyClaimedModal) return null;
    return (
      <div className="kksv-scrim" onClick={closeAlreadyClaimedModal}>
        <motion.div className="kksv-dialog" role="dialog" aria-modal="true" aria-labelledby="kksv-claimed-h" onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.77, 0, 0.18, 1] }}>
          <div className="kksv-dialog-head">
            <div>
              <p className="kksv-eyebrow">Welcome back</p>
              <h2 id="kksv-claimed-h">Already claimed</h2>
            </div>
            <button type="button" className="kksv-x" onClick={closeAlreadyClaimedModal} aria-label="Close">
              <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2.2" /></svg>
            </button>
          </div>
          <div className="kksv-dialog-body">
            <p>This account has already used its free <b>{freeServiceStatus.serviceName || 'Standard Klean'}</b>. Every other Klean is open to book, from ₵50 a pair.</p>
            <div className="kksv-row">
              <button type="button" className="kksv-btn go" onClick={closeAlreadyClaimedModal}>See services <span className="ar" aria-hidden="true">→</span></button>
              <button type="button" className="kksv-btn" onClick={() => { closeAlreadyClaimedModal(); openCart(); }}>View cart</button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // Free first-Klean note under the header
  const renderFreeServiceBanner = () => {
    const freeServiceStatus = getUserFreeServiceStatus();
    const freeService = services.find((s) => s.is_free_signup_service);
    if (isAuthenticated && freeServiceStatus.hasUsed) {
      return <p className="kksv-note">You've used your free <b>{freeServiceStatus.serviceName}</b>. Thanks for coming back.</p>;
    }
    if (!freeService) return null;
    if (isAuthenticated) {
      return (
        <div className="kksv-offer">
          <div><p className="kksv-eyebrow">For you</p><b>Your first Klean is free</b><span>Add your free {freeService.name} to the cart. One per account.</span></div>
          <button type="button" className="kksv-btn go" onClick={() => serviceCardRefs.current[freeService.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Claim it <span className="ar" aria-hidden="true">→</span></button>
        </div>
      );
    }
    return (
      <div className="kksv-offer">
        <div><p className="kksv-eyebrow">New here?</p><b>First Klean free</b><span>Create an account and your first {freeService.name} is on us.</span></div>
        <Link to="/auth/register" className="kksv-btn go">Sign up <span className="ar" aria-hidden="true">→</span></Link>
      </div>
    );
  };

  const renderServiceCard = (service) => {
    const status = getServiceStatus(service.name);
    const isExpanded = expandedDescriptions[service.id];
    const isBundle = isBundleService(service);
    const isFreeService = service.is_free_signup_service;
    const isHighlighted = highlightedService === service.id;
    const isAdding = addingToCart === service.id;
    const canClaimFreeService = isFreeService && isAuthenticated && user && !user.free_signup_service_used;
    const showAlreadyClaimed = isFreeService && isAuthenticated && user && user.free_signup_service_used;
    const pairs = Number(service.included_quantity) || 1;
    const long = (service.description || '').length > 110;

    let cta;
    if (isAdding) cta = <><span className="kksv-spin" aria-hidden="true" /> Adding…</>;
    else if (isFreeService) {
      if (canClaimFreeService) cta = <>Add free Klean <span className="ar" aria-hidden="true">→</span></>;
      else if (showAlreadyClaimed) cta = 'Already claimed';
      else if (!isAuthenticated) cta = <>Sign up to claim <span className="ar" aria-hidden="true">→</span></>;
      else cta = 'Not eligible';
    } else cta = <>Add to cart <span className="ar" aria-hidden="true">→</span></>;

    return (
      <motion.article
        data-service-id={service.id}
        ref={(el) => { serviceCardRefs.current[service.id] = el; }}
        key={service.id}
        className={`kksv-card ${isFreeService ? 'free' : ''} ${isHighlighted ? 'lit' : ''} ${showAlreadyClaimed ? 'used' : ''}`}
        variants={fadeInUp}
      >
        <div className="kksv-pic">
          <img src={service.image} alt="" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = '/images/service-fallback.svg'; }} />
          {isFreeService
            ? <span className="kksv-flag">{canClaimFreeService ? 'Free for you' : showAlreadyClaimed ? 'Claimed' : 'Sign-up gift'}</span>
            : isBundle && service.savingsAmount ? <span className="kksv-flag">Save ₵{service.savingsAmount}</span> : null}
        </div>
        <div className="kksv-body">
          <span className={`kksv-time ${status.isPriority ? 'fast' : ''}`}>{status.isPriority ? 'Back next day' : 'Back in 72 hours'}</span>
          <h3>{service.name}</h3>
          {service.description && (
            <>
              <p className={`kksv-desc ${isExpanded ? 'open' : ''}`}>{service.description}</p>
              {long && (
                <button type="button" className="kksv-more" onClick={() => toggleDescription(service.id)} aria-expanded={!!isExpanded}>
                  {isExpanded ? 'Less' : 'More'}
                </button>
              )}
            </>
          )}
          <div className="kksv-price">
            {isFreeService ? (
              <><strong>Free</strong>{service.original_price && <s>₵{service.original_price}</s>}</>
            ) : (
              <><strong>₵{Number(service.price).toLocaleString('en-GH')}</strong><small>{isBundle ? `${pairs} pairs` : 'per pair'}</small></>
            )}
            {isBundle && service.perSneakerPrice && <em>₵{service.perSneakerPrice} a pair</em>}
          </div>
          <button
            type="button"
            className={`kksv-btn wide ${isFreeService && !canClaimFreeService && isAuthenticated ? '' : 'go'}`}
            onClick={() => (isFreeService ? handleFreeServiceClick(service) : handleAddToCart(service))}
            disabled={isAdding || (isFreeService && !canClaimFreeService && isAuthenticated)}
          >
            {cta}
          </button>
        </div>
      </motion.article>
    );
  };

  return (
    <div className="kksv">
      <style>{`
        .kksv{--ink:#0A0B0A;--paper:#F7F9F6;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--tint:#E9F4E7;--amber:#9A5B00;
          --display:"Anton","Arial Narrow",Impact,sans-serif;--spring:cubic-bezier(.2,1.25,.3,1);--swift:cubic-bezier(.77,0,.18,1);
          background:var(--paper);color:var(--ink);font-family:"League Spartan",system-ui,sans-serif;min-height:100vh}
        .kksv-wrap{max-width:1200px;margin:0 auto;padding:0 20px 72px}
        .kksv-eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
        .kksv-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:end;padding:48px 0 26px;border-bottom:2px solid var(--ink)}
        .kksv-hero h1{margin:8px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(56px,8.5vw,112px);line-height:.88}
        .kksv-hero p.sub{margin:14px 0 0;max-width:50ch;color:var(--muted);font-size:18px;line-height:1.5}
        .kksv-facts{display:flex;flex-wrap:wrap;gap:8px 22px;margin:18px 0 0;padding:0;list-style:none}
        .kksv-facts li{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
        .kksv-facts li::before{content:"";width:8px;height:8px;background:var(--green)}
        .kksv-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:50px;padding:0 20px;border:2px solid var(--ink);border-radius:2px;background:transparent;
          color:var(--ink);font:inherit;font-size:15px;font-weight:700;text-decoration:none;cursor:pointer;white-space:nowrap;transition:background .2s,color .2s,border-color .2s,transform .25s var(--spring)}
        .kksv-btn .ar{transition:transform .3s var(--spring)}
        .kksv-btn:hover:not(:disabled){background:var(--ink);color:#fff}
        .kksv-btn:hover:not(:disabled) .ar{transform:translateX(5px)}
        .kksv-btn:active:not(:disabled){transform:scale(.98)}
        .kksv-btn.go{background:var(--green);border-color:var(--green);color:#fff}
        .kksv-btn.go:hover:not(:disabled){background:var(--ink);border-color:var(--ink)}
        .kksv-btn:disabled{opacity:.45;cursor:default}
        .kksv-btn.wide{width:100%;margin-top:14px}
        .kksv :focus-visible{outline:2px solid var(--green);outline-offset:3px}
        .kksv-spin{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;animation:kksvSpin .8s linear infinite}
        @keyframes kksvSpin{to{transform:rotate(360deg)}}

        .kksv-offer{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px 20px;margin-top:22px;padding:18px 20px;background:var(--ink);color:#fff}
        .kksv-offer .kksv-eyebrow{color:#6FD46F}
        .kksv-offer b{display:block;margin-top:4px;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:28px;line-height:1}
        .kksv-offer span{display:block;margin-top:4px;color:#C4CCC2;font-size:15px}
        .kksv-offer .kksv-btn:hover{background:#fff;border-color:#fff;color:var(--ink)}
        .kksv-note{margin:22px 0 0;padding:12px 14px;border-left:3px solid var(--green);background:var(--tint);font-size:15px}
        .kksv-error{margin:22px 0 0;padding:12px 14px;border-left:3px solid #B42318;background:#FDECEA;color:#7A1A12;font-size:15px}

        .kksv-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin:36px 0 18px;padding-bottom:12px;border-bottom:2px solid var(--ink)}
        .kksv-head h2{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:34px;line-height:1}
        .kksv-head span{font-size:13px;color:var(--muted)}
        .kksv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:18px}
        .kksv-card{position:relative;display:flex;flex-direction:column;min-width:0;background:#fff;border:1px solid var(--line);transition:transform .4s var(--spring),border-color .2s,box-shadow .3s}
        .kksv-card:hover{transform:translateY(-5px);border-color:var(--ink)}
        .kksv-card.free{background:var(--tint);border-color:var(--tint)}
        .kksv-card.used{opacity:.75}
        .kksv-card.lit{border:2px solid var(--green);box-shadow:0 0 0 6px rgba(26,122,26,.15)}
        .kksv-pic{position:relative;aspect-ratio:4/3;overflow:hidden;background:var(--line)}
        .kksv-pic img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .7s var(--swift)}
        .kksv-card:hover .kksv-pic img{transform:scale(1.05)}
        .kksv-flag{position:absolute;top:0;right:0;background:var(--green);color:#fff;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:6px 10px}
        .kksv-body{display:flex;flex-direction:column;flex:1;padding:18px 18px 20px}
        .kksv-time{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
        .kksv-time::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--green)}
        .kksv-time.fast::before{background:#E08A00}
        .kksv-body h3{margin:10px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:30px;line-height:.95}
        .kksv-desc{margin:8px 0 0;font-size:15px;line-height:1.5;color:var(--muted);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
        .kksv-desc.open{-webkit-line-clamp:unset;display:block}
        .kksv-more{align-self:flex-start;margin-top:4px;padding:0;border:0;background:none;font:inherit;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
        .kksv-price{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 10px;margin-top:auto;padding-top:14px}
        .kksv-price strong{font-family:var(--display);font-weight:400;font-size:42px;line-height:1;font-variant-numeric:tabular-nums}
        .kksv-price small{font-size:13px;color:var(--muted)}
        .kksv-price s{color:var(--muted);font-size:16px}
        .kksv-price em{flex-basis:100%;font-style:normal;font-size:13px;font-weight:700;color:var(--green)}
        .kksv-skel{height:430px;background:linear-gradient(90deg,var(--line) 0%,#EEF2EC 50%,var(--line) 100%);background-size:200% 100%;animation:kksvShim 1.3s linear infinite}
        @keyframes kksvShim{to{background-position:-200% 0}}
        .kksv-empty{padding:56px 24px;border:2px dashed var(--line);text-align:center}
        .kksv-empty h3{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:40px}
        .kksv-empty p{margin:10px auto 0;max-width:44ch;color:var(--muted)}
        .kksv-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:36px;padding-top:24px;border-top:2px solid var(--ink)}

        .kksv-scrim{position:fixed;inset:0;z-index:60;background:rgba(10,11,10,.55);display:flex;align-items:center;justify-content:center;padding:16px}
        .kksv-dialog{width:100%;max-width:440px;background:var(--paper);border:2px solid var(--ink);color:var(--ink);font-family:"League Spartan",system-ui,sans-serif}
        .kksv-dialog-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:20px 20px 14px;border-bottom:2px solid var(--ink)}
        .kksv-dialog-head h2{margin:6px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:34px;line-height:.95}
        .kksv-dialog-body{padding:18px 20px 20px}
        .kksv-dialog-body p{margin:0;color:var(--muted);line-height:1.55}
        .kksv-dialog-body b{color:var(--ink)}
        .kksv-row{display:flex;gap:10px;margin-top:18px}
        .kksv-row .kksv-btn{flex:1}
        .kksv-x{flex:none;width:42px;height:42px;display:grid;place-items:center;border:2px solid var(--ink);background:none;color:var(--ink);cursor:pointer;transition:background .2s,color .2s,transform .3s var(--spring)}
        .kksv-x:hover{background:var(--ink);color:#fff;transform:rotate(90deg)}
        @media (max-width:760px){.kksv-hero{grid-template-columns:1fr}}
        @media (max-width:560px){
          .kksv-wrap{padding:0 16px 56px}
          .kksv-hero{padding:32px 0 20px}
          .kksv-hero p.sub{font-size:16px}
          .kksv-grid{grid-template-columns:1fr}
          .kksv-offer .kksv-btn{width:100%}
          .kksv-row{flex-direction:column}
          .kksv-links .kksv-btn{flex:1 1 100%}
        }
        @media (prefers-reduced-motion:reduce){.kksv-skel{animation:none}}
      `}</style>
      {renderAlreadyClaimedModal()}

      <div className="kksv-wrap">
        <header className="kksv-hero">
          <div>
            <p className="kksv-eyebrow">Services & prices</p>
            <h1>Book a Klean</h1>
            <p className="sub">Every Klean is priced per pair. Add what you need, choose pickup or drop-off at checkout, and pay with Mobile Money or card.</p>
            <ul className="kksv-facts">
              <li>Pickup & delivery in Accra</li>
              <li>Back in 72 hours</li>
              <li>Bundles save more</li>
            </ul>
          </div>
        </header>

        {renderFreeServiceBanner()}
        {error && <p className="kksv-error" role="alert">{error}</p>}

        <section ref={servicesSectionRef} id="services" aria-labelledby="kksv-list-h">
          <div className="kksv-head">
            <h2 id="kksv-list-h">All services</h2>
            {!loading && sortedServices.length > 0 && <span>{String(sortedServices.length).padStart(2, '0')} services</span>}
          </div>
          {loading ? (
            <div className="kksv-grid" aria-busy="true" aria-label="Loading services">
              {[0, 1, 2, 3].map((k) => <div key={k} className="kksv-skel" />)}
            </div>
          ) : sortedServices.length === 0 ? (
            <div className="kksv-empty">
              <h3>Back soon</h3>
              <p>We're updating our services. Message us on WhatsApp and we'll book you in directly.</p>
            </div>
          ) : (
            <motion.div className="kksv-grid" variants={stagger} initial="hidden" animate="visible">
              {sortedServices.map(renderServiceCard)}
            </motion.div>
          )}
        </section>

        <div className="kksv-links">
          <Link to="/rate-and-services" className="kksv-btn">Full price list <span className="ar" aria-hidden="true">→</span></Link>
          <Link to="/vouchers" className="kksv-btn">Gift a Klean</Link>
          <a className="kksv-btn" href="https://wa.me/233536278834" target="_blank" rel="noreferrer">Ask on WhatsApp</a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Services;
