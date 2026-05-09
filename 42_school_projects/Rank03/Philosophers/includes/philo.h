/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   philo.h                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/05/05 19:51:58 by lraghave          #+#    #+#             */
/*   Updated: 2026/05/05 19:52:20 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#ifndef PHILO_H
# define PHILO_H

# include <pthread.h>
# include <sys/time.h>
# include <unistd.h>
# include <stdlib.h>
# include <stdio.h>

typedef struct s_table	t_table;
typedef struct s_philo	t_philo;

struct s_philo
{
	int				id;
	int				meals;
	long			last_meal;
	pthread_t		thread;
	pthread_mutex_t	*left_fork;
	pthread_mutex_t	*right_fork;
	t_table			*table;
};

struct s_table
{
	int				count;
	long			time_to_die;
	long			time_to_eat;
	long			time_to_sleep;
	int				must_eat;
	int				stop;
	long			start_time;
	t_philo			*philos;
	pthread_mutex_t	*forks;
	pthread_mutex_t	print_lock;
	pthread_mutex_t	state_lock;
};

int		parse_args(int argc, char **argv, t_table *table);
int		init_table(t_table *table);
int		start_simulation(t_table *table);
void	cleanup(t_table *table);

void	*routine(void *arg);
void	monitor(t_table *table);

long	now_ms(void);
long	elapsed(t_table *table);
void	smart_sleep(t_table *table, long duration);

int		is_stopped(t_table *table);
void	set_stop(t_table *table);
void	print_state(t_philo *philo, char *msg);

#endif
