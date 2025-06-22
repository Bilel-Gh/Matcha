import React, { useState, useEffect, useRef } from 'react';

interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  age?: number;
  birth_date?: string;
  city: string;
  country: string;
  profile_picture_url: string;
  biography: string;
  distance_km: number;
  fame_rating: number;
  common_interests: number;
  common_interests_count?: number;
  common_interests_names?: string[];
  is_online?: boolean;
  last_connection?: string;
}

interface SwipeCardProps {
  user: User;
  index: number;
  isActive: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ user, index, isActive, onSwipeRight, onSwipeLeft }) => {
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    currentX: 0,
    rotation: 0
  });
  const [isExiting, setIsExiting] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  // Utiliser une ref pour stocker le deltaX actuel
  const currentDeltaXRef = useRef<number>(0);

  // Fonction utilitaire pour vérifier si la référence est valide
  const isCardRefValid = (): boolean => {
    return cardRef.current !== null && cardRef.current !== undefined;
  };

  const handleStart = (clientX: number) => {
    if (!isActive || isExiting || !isCardRefValid()) return;

    currentDeltaXRef.current = 0;
    setDragState({
      isDragging: true,
      startX: clientX,
      currentX: 0,
      rotation: 0
    });
  };

  const handleMove = (clientX: number) => {
    if (!dragState.isDragging || !isActive || isExiting || !isCardRefValid()) return;

    const deltaX = clientX - dragState.startX;
    const rotation = deltaX * 0.1;

    // Stocker le deltaX actuel dans la ref
    currentDeltaXRef.current = deltaX;

    setDragState(prev => ({
      ...prev,
      currentX: deltaX,
      rotation: Math.max(-15, Math.min(15, rotation))
    }));

    // Update card transform avec vérification
    if (isCardRefValid()) {
      cardRef.current!.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
      cardRef.current!.style.opacity = String(Math.max(0.7, 1 - Math.abs(deltaX) / 400));
    }

    // Show swipe indicators
    updateSwipeIndicators(deltaX);
  };

  const handleEnd = () => {
    if (!dragState.isDragging || !isActive || isExiting || !isCardRefValid()) return;

    const threshold = 80;
    // Utiliser la ref au lieu du state pour avoir la vraie valeur
    const deltaX = currentDeltaXRef.current;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        animateSwipeExit('right', onSwipeRight);
      } else {
        animateSwipeExit('left', onSwipeLeft);
      }
    } else {
      console.log('Snap back - insufficient swipe distance');
      snapBack();
    }

    // Réinitialiser après avoir utilisé la valeur
    currentDeltaXRef.current = 0;
    setDragState({ isDragging: false, startX: 0, currentX: 0, rotation: 0 });
  };

  const animateSwipeExit = (direction: 'left' | 'right', callback: () => void) => {
    if (!isCardRefValid() || isExiting) return;

    setIsExiting(true);

    const exitX = direction === 'right' ? 400 : -400;
    const exitRotation = direction === 'right' ? 25 : -25;

    // Apply exit animation avec vérification
    if (isCardRefValid()) {
      cardRef.current!.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease-out';
      cardRef.current!.style.transform = `translateX(${exitX}px) rotate(${exitRotation}deg) scale(0.9)`;
      cardRef.current!.style.opacity = '0';
      cardRef.current!.style.pointerEvents = 'none';

      // Clear indicators
      const likeIndicator = cardRef.current!.querySelector('.like-indicator') as HTMLElement;
      const passIndicator = cardRef.current!.querySelector('.pass-indicator') as HTMLElement;
      if (likeIndicator) {
        likeIndicator.style.opacity = '0';
        likeIndicator.style.transform = 'scale(0.8)';
      }
      if (passIndicator) {
        passIndicator.style.opacity = '0';
        passIndicator.style.transform = 'scale(0.8)';
      }
    }

    // Call callback after animation completes
    setTimeout(() => {
      if (isCardRefValid()) {
        cardRef.current!.style.display = 'none';
      }
      callback();
    }, 400);
  };

  const snapBack = () => {
    if (!isCardRefValid()) return;

    cardRef.current!.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    cardRef.current!.style.transform = 'translateX(0px) rotate(0deg)';
    cardRef.current!.style.opacity = '1';

    // Clear indicators
    const likeIndicator = cardRef.current!.querySelector('.like-indicator') as HTMLElement;
    const passIndicator = cardRef.current!.querySelector('.pass-indicator') as HTMLElement;
    if (likeIndicator) {
      likeIndicator.style.opacity = '0';
      likeIndicator.style.transform = 'scale(0.8)';
    }
    if (passIndicator) {
      passIndicator.style.opacity = '0';
      passIndicator.style.transform = 'scale(0.8)';
    }

    setTimeout(() => {
      if (isCardRefValid()) {
        cardRef.current!.style.transition = '';
      }
    }, 300);
  };

  const updateSwipeIndicators = (deltaX: number) => {
    if (!isCardRefValid()) return;

    const likeIndicator = cardRef.current!.querySelector('.like-indicator') as HTMLElement;
    const passIndicator = cardRef.current!.querySelector('.pass-indicator') as HTMLElement;

    if (deltaX > 50) {
      if (likeIndicator) {
        likeIndicator.style.opacity = String(Math.min(1, deltaX / 120));
        likeIndicator.style.transform = 'scale(1)';
      }
      if (passIndicator) {
        passIndicator.style.opacity = '0';
        passIndicator.style.transform = 'scale(0.8)';
      }
    } else if (deltaX < -50) {
      if (passIndicator) {
        passIndicator.style.opacity = String(Math.min(1, Math.abs(deltaX) / 120));
        passIndicator.style.transform = 'scale(1)';
      }
      if (likeIndicator) {
        likeIndicator.style.opacity = '0';
        likeIndicator.style.transform = 'scale(0.8)';
      }
    } else {
      if (likeIndicator) {
        likeIndicator.style.opacity = '0';
        likeIndicator.style.transform = 'scale(0.8)';
      }
      if (passIndicator) {
        passIndicator.style.opacity = '0';
        passIndicator.style.transform = 'scale(0.8)';
      }
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };



  const handleTouchEnd = () => {
    handleEnd();
  };

  // Event listeners pour souris - amélioration de la gestion
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      handleEnd();
    };

    // Ajouter les événements sur document pour capturer même si la souris sort de la carte
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, dragState.startX]);

  // Reset styles when component unmounts or user changes
  useEffect(() => {
    return () => {
      if (isCardRefValid()) {
        cardRef.current!.style.transform = '';
        cardRef.current!.style.opacity = '';
        cardRef.current!.style.transition = '';
        cardRef.current!.style.pointerEvents = '';
        cardRef.current!.style.display = '';
      }
    };
  }, [user.id]);

  // Reset exiting state when user changes
  useEffect(() => {
    setIsExiting(false);
    currentDeltaXRef.current = 0;
    setDragState({ isDragging: false, startX: 0, currentX: 0, rotation: 0 });
  }, [user.id]);

  // Gestionnaire d'événements touch avec { passive: false } pour permettre preventDefault
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleTouchMoveWithPrevent = (e: TouchEvent) => {
      if (dragState.isDragging && isActive && !isExiting) {
        e.preventDefault(); // Maintenant on peut faire preventDefault
        handleMove(e.touches[0].clientX);
      }
    };

    // Ajouter l'événement touchmove avec { passive: false }
    card.addEventListener('touchmove', handleTouchMoveWithPrevent, { passive: false });

    return () => {
      card.removeEventListener('touchmove', handleTouchMoveWithPrevent);
    };
  }, [dragState.isDragging, isActive, isExiting, dragState.startX]);

  const getFullImageUrl = (url: string): string => {
    if (!url) return '/placeholder-image.svg';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to user profile page - visit will be recorded there
    window.location.href = `/user/${user.id}`;
  };

  const age = calculateAge(user.birth_date || user.age);

  return (
    <div
      ref={cardRef}
      className={`swipe-card ${isActive ? 'active' : ''} ${isExiting ? 'exiting' : ''}`}
      style={{
        zIndex: 10 - index,
        transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
        pointerEvents: isActive && !isExiting ? 'auto' : 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="card-image" onClick={handleImageClick}>
        <img
          src={getFullImageUrl(user.profile_picture_url)}
          alt={user.firstname}
          draggable={false}
        />
        <div className="card-overlay">
          <div className="swipe-indicators">
            <div className="indicator like-indicator">LIKE</div>
            <div className="indicator pass-indicator">PASS</div>
          </div>
          <div className="online-status">
            {user.is_online ? '🟢 Online' : '⚫ Offline'}
          </div>
        </div>
      </div>

      <div className="card-info">
        <div className="user-header">
          <div className="main-info">
            <h2>{user.firstname}{age && `, ${age}`}</h2>
            <div className="location-distance">
              📍 {user.city}, {user.country} • {user.distance_km}km
            </div>
          </div>

          <div className="user-stats">
            <div className="fame-rating">
              ⭐ {user.fame_rating}
            </div>
          </div>
        </div>

        {(user.common_interests_count || user.common_interests) > 0 && (
          <div className="common-interests">
            ❤️ {user.common_interests_names && user.common_interests_names.length > 0
              ? user.common_interests_names.slice(0, 3).join(', ') + (user.common_interests_names.length > 3 ? '...' : '')
              : `${user.common_interests_count || user.common_interests} common interests`
            }
          </div>
        )}

        <div className="bio-preview">
          <p>{user.biography ? (user.biography.length > 120 ? user.biography.substring(0, 120) + '...' : user.biography) : 'No bio available'}</p>
        </div>
      </div>
    </div>
  );
};

// Helper functions

const calculateAge = (birthDateOrAge?: string | number): string => {
  if (typeof birthDateOrAge === 'number') {
    return String(birthDateOrAge);
  }

  if (!birthDateOrAge) return '';

  const today = new Date();
  const birth = new Date(birthDateOrAge);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return String(age);
};

export default SwipeCard;
