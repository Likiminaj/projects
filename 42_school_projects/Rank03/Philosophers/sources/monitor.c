#include "philo.h"

static int	check_death(t_table *table, int i)
{
	long	last_meal;

	pthread_mutex_lock(&table->state_lock);
	last_meal = table->philos[i].last_meal;
	pthread_mutex_unlock(&table->state_lock);
	if (now_ms() - last_meal >= table->time_to_die)
	{
		pthread_mutex_lock(&table->print_lock);
		pthread_mutex_lock(&table->state_lock);
		table->stop = 1;
		pthread_mutex_unlock(&table->state_lock);
		printf("%ld %d died\n", elapsed(table), table->philos[i].id);
		pthread_mutex_unlock(&table->print_lock);
		return (1);
	}
	return (0);
}

static int	all_ate_enough(t_table *table)
{
	int	i;
	int	full;

	if (table->must_eat == -1)
		return (0);
	i = 0;
	full = 0;
	pthread_mutex_lock(&table->state_lock);
	while (i < table->count)
	{
		if (table->philos[i].meals >= table->must_eat)
			full++;
		i++;
	}
	pthread_mutex_unlock(&table->state_lock);
	return (full == table->count);
}

void	monitor(t_table *table)
{
	int	i;

	while (!is_stopped(table))
	{
		i = 0;
		while (i < table->count && !is_stopped(table))
		{
			if (check_death(table, i))
				return ;
			i++;
		}
		if (all_ate_enough(table))
		{
			set_stop(table);
			return ;
		}
		usleep(1000);
	}
}
