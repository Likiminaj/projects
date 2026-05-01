#include "philo.h"

int	start_simulation(t_table *table)
{
	int	i;

	i = 0;
	while (i < table->count)
	{
		if (pthread_create(&table->philos[i].thread, NULL,
				routine, &table->philos[i]) != 0)
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

int	init_table(t_table *table)
{
	table->philos = malloc(sizeof(t_philo) * table->count);
	if (!table->philos)
		return (0);
	table->forks = malloc(sizeof(pthread_mutex_t) * table->count);
	if (!table->forks)
		return (free(table->philos), 0);
	table->start_time = now_ms();
	if (!init_mutexes(table))
		return (0);
	init_philos(table);
	return (1);
}

static int	init_mutexes(t_table *table)
{
	int	i;

	i = 0;
	while (i < table->count)
	{
		if (pthread_mutex_init(&table->forks[i], NULL) != 0)
			return (0);
		i++;
	}
	if (pthread_mutex_init(&table->print_lock, NULL) != 0)
		return (0);
	if (pthread_mutux_init(&table->state_lock, NULL) != 0)
		return (0);
	return (1);
}

static void	intit_philosophers(t_table *table)
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
