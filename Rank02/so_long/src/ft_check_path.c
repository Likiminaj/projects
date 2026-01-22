/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_check_path.c                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <marvin@42.fr>                    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/25 18:52:00 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/27 12:41:43 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../header/so_long.h"

// prototype(s)
static void	ft_flood_fill(int p_x, int p_y, t_map_data *map_data);

void	ft_check_path(t_map_data *map_data)
{
	int	p_x;
	int	p_y;

	map_data->e_count = 0;
	map_data->c_count = 0;
	p_x = map_data->player->x_position;
	p_y = map_data->player->y_position;
	ft_flood_fill(p_x, p_y, map_data);
	if (map_data->e_count != map_data->exit->exit_count
		|| map_data->c_count != map_data->collectibles)
		ft_error("Collectibles / exit unreachable\n", map_data);
}

static void	ft_flood_fill(int p_x, int p_y, t_map_data *map_data)
{
	if (p_x < 0 || p_x >= map_data->width
		|| p_y < 0 || p_y >= map_data->height)
		return ;
	if (map_data->map_flood[p_y][p_x] == '1')
		return ;
	if (map_data->map_flood[p_y][p_x] == 'C')
		map_data->c_count++;
	if (map_data->map_flood[p_y][p_x] == 'E')
		map_data->e_count++;
	map_data->map_flood[p_y][p_x] = '1';
	ft_flood_fill(p_x, p_y + 1, map_data);
	ft_flood_fill(p_x, p_y - 1, map_data);
	ft_flood_fill(p_x + 1, p_y, map_data);
	ft_flood_fill(p_x - 1, p_y, map_data);
}
