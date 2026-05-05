#include "philo.h"

void	print_state(t_philo *philo, char *msg)
{
	pthread_mutex_lock(&philo->table->print_lock);
	if (!is_stopped(philo->table))
		printf("%ld %d %s\n", elapsed(philo->table), philo->id, msg);
	pthread_mutex_unlock(&philo->table->print_lock);
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
		print_state(philo, "is thinking");
	}
	return (NULL);
}
