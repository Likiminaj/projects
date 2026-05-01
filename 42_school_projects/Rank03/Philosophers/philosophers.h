#ifndef PHILO_H
# define PHILO_H

# include <pthread.h>
# include <sys/time.h>
# include <unistd.h>
# include <stdlib.h>
# include <stdio.h>

typedef struct s_table t_table;

typedef struct	s_philo
{
	int			id;
	int			meals;
	long			last_meal;
	pthread_t		thread;
	pthread_mutex_t		*left_fork;
	pthread_mutex_t		*right_fork;
	t_table			*table;
}	t_philio;

typedef struct	s_table
{
	int			count;
	long			time_to_die;
	long			time_to_eat;
	long			time_to_sleep;
	int			must_eat;
	int			stop;
	t_philo			*philos;
	pthread_mutex_t		*forks;
	pthread_mutex_t		print_lock;
	pthread_mutex_t		state_lock;
}	t_table;

#endif
