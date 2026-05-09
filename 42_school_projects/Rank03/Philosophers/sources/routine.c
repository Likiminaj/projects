/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   routine.c                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/05/05 19:54:14 by lraghave          #+#    #+#             */
/*   Updated: 2026/05/09 13:46:27 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "philo.h"

static void	think(t_philo *philo)
{
	long	think_time;

	print_state(philo, "is thinking");
	if (philo->table->count % 2 == 0)
		return ;
	think_time = (philo->table->time_to_die
			- philo->table->time_to_eat
			- philo->table->time_to_sleep) / 2;
	if (think_time > 0)
		smart_sleep(philo->table, think_time);
}

static void	take_forks(t_philo *philo)
{
	if (philo->id % 2 == 0)
	{
		pthread_mutex_lock(philo->right_fork);
		print_state(philo, "has taken a fork");
		pthread_mutex_lock(philo->left_fork);
		print_state(philo, "has taken a fork");
	}
	else
	{
		pthread_mutex_lock(philo->left_fork);
		print_state(philo, "has taken a fork");
		pthread_mutex_lock(philo->right_fork);
		print_state(philo, "has taken a fork");
	}
}

static void	eat(t_philo *philo)
{
	take_forks(philo);
	pthread_mutex_lock(&philo->table->state_lock);
	philo->last_meal = now_ms();
	philo->meals++;
	pthread_mutex_unlock(&philo->table->state_lock);
	print_state(philo, "is eating");
	smart_sleep(philo->table, philo->table->time_to_eat);
	pthread_mutex_unlock(philo->left_fork);
	pthread_mutex_unlock(philo->right_fork);
}

static void	one_philo(t_philo *philo)
{
	pthread_mutex_lock(philo->left_fork);
	print_state(philo, "has taken a fork");
	smart_sleep(philo->table, philo->table->time_to_die);
	pthread_mutex_unlock(philo->left_fork);
}

void	*routine(void *arg)
{
	t_philo	*philo;

	philo = (t_philo *)arg;
	if (philo->table->count == 1)
	{
		one_philo(philo);
		return (NULL);
	}
	if (philo->id % 2 == 0)
		usleep(1000);
	while (!is_stopped(philo->table))
	{
		eat(philo);
		print_state(philo, "is sleeping");
		smart_sleep(philo->table, philo->table->time_to_sleep);
		think(philo);
	}
	return (NULL);
}
