export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.'
      });
    }

    next();
  };
};

export const isAdmin = restrictTo('admin');
export const isTeacher = restrictTo('admin', 'teacher');
export const isLearner = restrictTo('admin', 'teacher', 'learner');