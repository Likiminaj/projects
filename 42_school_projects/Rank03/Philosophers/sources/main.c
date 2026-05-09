/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.c                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/05/05 19:53:12 by lraghave          #+#    #+#             */
/*   Updated: 2026/05/09 14:02:44 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "philo.h"

int	main(int argc, char **argv)
{
	t_table	table;

	if (argc != 5 && argc != 6)
	{
		printf("Error\nUsage: ./philo number_of_philosophers ");
		printf("time_to_die time_to_eat time_to_sleep [must_eat]\n");
		return (1);
	}
	if (!parse_args(argc, argv, &table))
		return (printf("Error\nInvalid arguments\n"), 1);
	if (!init_table(&table))
		return (printf("Error\nInit failed\n"), 1);
	if (!start_simulation(&table))
	{
		cleanup(&table);
		return (printf("Error\nThread creation failed\n"), 1);
	}
	cleanup(&table);
	return (0);
}

void	print_state(t_philo *philo, char *msg)
{
	pthread_mutex_lock(&philo->table->print_lock);
	if (!is_stopped(philo->table))
		printf("%ld %d %s\n", elapsed(philo->table), philo->id, msg);
	pthread_mutex_unlock(&philo->table->print_lock);
}
