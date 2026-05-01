#include "philo.h"

//prototype(s)


int	start_simulation(t_table *table)
{
	int	i;

	i = 0;
	while (i < table->count)
	{
		if (pthread_create(&table->philos[i].thread, NULL, routine, &table->philos[i]) != 0)
			return (0);
		i++;
	}
	monitor(table);
	i = 0;
	while (i < table->count)
	{
		pthread_join(table->philos[i].thread, NULL);
		i++;
	}
	return (1);
}

void	cleanup(t_table *table)
{
	int	i;

	i = 0;
	while (i < table->count)
	{
		pthread_mutex_destroy(&table->forks[i]);
		i++;
	}
	pthread_mutex_destroy(&table->print_lock);
	pthread_mutex_destroy(&table->state_lock);
	free(table->forks);
	free(table->philos);
}

static void	init_philos(t_table *table)
{
	int	i;

	i = 0;
	while (i < table->count)
	{
		table->philos[i].id = i + 1;
		table->philos[i].meals = 0;
		table->philos[i].last_meal = table->start_time;
		table->philos[i].left_fork = &table->forks[i];
		table->philos[i].right_fork = &table->forks[(i + 1) % table->count];
		table->philos[i].table = table;
		i++;
	}
}
